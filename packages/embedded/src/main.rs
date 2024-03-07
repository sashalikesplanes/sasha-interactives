#![no_std]
#![no_main]

use cyw43_pio::PioSpi;
use defmt::*;
use embassy_executor::Spawner;
use embassy_rp::bind_interrupts;
use embassy_rp::gpio::{Level, Output};
use embassy_rp::peripherals::{DMA_CH0, PIO0};
use embassy_rp::pio::{InterruptHandler, Pio};
use embassy_time::{Delay, Duration, Ticker, Timer};
use embedded_graphics::mono_font::ascii::{FONT_4X6, FONT_6X10};
use embedded_graphics::mono_font::MonoTextStyle;
use embedded_graphics::pixelcolor::Rgb565;
use embedded_graphics::prelude::*;
use embedded_graphics::primitives::{Circle, PrimitiveStyle, PrimitiveStyleBuilder, Rectangle, StrokeAlignment, Triangle};
use embedded_graphics::text::{Alignment, Text};
use hub75::Hub75;
use static_cell::StaticCell;
use {defmt_rtt as _, panic_probe as _};

bind_interrupts!(struct Irqs {
    PIO0_IRQ_0 => InterruptHandler<PIO0>;
});

#[embassy_executor::task]
async fn wifi_task(
    runner: cyw43::Runner<'static, Output<'static>, PioSpi<'static, PIO0, 0, DMA_CH0>>,
) -> ! {
    runner.run().await
}

#[embassy_executor::task]
async fn hub_task(
    mut display: Hub75<(
        Output<'static>, // r1
        Output<'static>, // g1
        Output<'static>, // b1
        Output<'static>, // r2
        Output<'static>, // g2
        Output<'static>, // b2
        Output<'static>, // a
        Output<'static>, // b
        Output<'static>, // c
        Output<'static>, // d
        Output<'static>, // f
        Output<'static>, // clk
        Output<'static>, // lat
        Output<'static>, // oe
    )>,
) -> ! {
    let mut ticker = Ticker::every(Duration::from_secs(1));
    let mut delay = Delay;
    loop {
        let fill = PrimitiveStyle::with_fill(Rgb565::CSS_PLUM);
        let _ = Rectangle::new(Point::new(10, 10), Size::new(20, 20))
            .into_styled(fill)
            .draw(&mut display);

        // Create styles used by the drawing operations.
        let thin_stroke = PrimitiveStyle::with_stroke(Rgb565::RED, 1);
        let thick_stroke = PrimitiveStyle::with_stroke(Rgb565::GREEN, 3);
        let border_stroke = PrimitiveStyleBuilder::new()
            .stroke_color(Rgb565::BLUE)
            .stroke_width(3)
            .stroke_alignment(StrokeAlignment::Inside)
            .build();
        let fill = PrimitiveStyle::with_fill(Rgb565::YELLOW);
        let character_style = MonoTextStyle::new(&FONT_4X6, Rgb565::WHITE);

        let yoffset = 10;

        // Draw a 3px wide outline around the display.
        let _ = display
            .bounding_box()
            .into_styled(border_stroke)
            .draw(&mut display);
        // Draw centered text.
        let text = "test";
        Text::with_alignment(
            text,
            display.bounding_box().center() + Point::new(0, 15),
            character_style,
            Alignment::Center,
        )
        .draw(&mut display);
        // Infallible
        let _ = display.output(&mut delay);
        ticker.next().await;
    }
}

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    let p = embassy_rp::init(Default::default());
    // let fw = include_bytes!("../cyw43-firmware/43439A0.bin");
    // let clm = include_bytes!("../cyw43-firmware/43439A0_clm.bin");

    // To make flashing faster for development, you may want to flash the firmwares independently
    // at hardcoded addresses, instead of baking them into the program with `include_bytes!`:
    //     probe-rs download 43439A0.bin --format bin --chip RP2040 --base-address 0x10100000
    //     probe-rs download 43439A0_clm.bin --format bin --chip RP2040 --base-address 0x10140000
    let fw = unsafe { core::slice::from_raw_parts(0x10100000 as *const u8, 230321) };
    let clm = unsafe { core::slice::from_raw_parts(0x10140000 as *const u8, 4752) };

    let pwr = Output::new(p.PIN_23, Level::Low);
    let cs = Output::new(p.PIN_25, Level::High);
    let mut pio = Pio::new(p.PIO0, Irqs);
    let spi = PioSpi::new(
        &mut pio.common,
        pio.sm0,
        pio.irq0,
        cs,
        p.PIN_24,
        p.PIN_29,
        p.DMA_CH0,
    );

    static STATE: StaticCell<cyw43::State> = StaticCell::new();
    let state = STATE.init(cyw43::State::new());
    let (_net_device, mut control, runner) = cyw43::new(state, pwr, spi, fw).await;
    unwrap!(spawner.spawn(wifi_task(runner)));

    control.init(clm).await;
    control
        .set_power_management(cyw43::PowerManagementMode::PowerSave)
        .await;

    // For 64x64 display with SEENGREAT adapter
    let hub_pins_adapter = (
        Output::new(p.PIN_0, Level::Low),  // r1
        Output::new(p.PIN_1, Level::Low),  // g1
        Output::new(p.PIN_2, Level::Low),  // b1
        Output::new(p.PIN_3, Level::Low),  // r2
        Output::new(p.PIN_4, Level::Low),  // g2
        Output::new(p.PIN_5, Level::Low),  // b2
        Output::new(p.PIN_7, Level::Low), // a
        Output::new(p.PIN_8, Level::Low), // b
        Output::new(p.PIN_9, Level::Low), // c
        Output::new(p.PIN_10, Level::Low), // d
        Output::new(p.PIN_6, Level::Low), // f (or e)
        Output::new(p.PIN_11, Level::Low), // clk
        Output::new(p.PIN_12, Level::Low), // lat
        Output::new(p.PIN_13, Level::Low), // oe
    );
    let hub = Hub75::new(hub_pins_adapter, 4);
    unwrap!(spawner.spawn(hub_task(hub)));

    let delay = Duration::from_millis(100);
    loop {
        info!("led on!");
        control.gpio_set(0, true).await;
        Timer::after(delay).await;

        info!("led off!");
        control.gpio_set(0, false).await;
        Timer::after(delay).await;
    }
}
