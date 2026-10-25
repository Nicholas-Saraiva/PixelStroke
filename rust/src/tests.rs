use crate::grid::Grid;

const EMPTY_COLOR: u32 = 0xFFFFFFFF; // opaque white (RRGGBBAA)
const RED: u32 = 0xFF0000FF;
const BLACK: u32 = 0x000000FF;

fn count_color(grid: &Grid, color: u32) -> usize {
    let mut count = 0;
    for y in 0..grid.height() as i32 {
        for x in 0..grid.width() as i32 {
            if grid.get_pixel(x, y) == Some(color) {
                count += 1;
            }
        }
    }
    count
}

#[test]
fn new_grid_is_white_32x32() {
    let grid = Grid::new();
    assert_eq!(grid.width(), 32);
    assert_eq!(grid.height(), 32);
    assert_eq!(grid.pixels_len(), 1024);
    assert_eq!(count_color(&grid, EMPTY_COLOR), 1024);
}

#[test]
fn set_get_pixel_roundtrip() {
    let mut grid = Grid::new();
    grid.set_pixel(5, 7, RED);
    assert_eq!(grid.get_pixel(5, 7), Some(RED));
    grid.set_pixel(0, 0, BLACK);
    grid.set_pixel(31, 31, BLACK);
    assert_eq!(grid.get_pixel(0, 0), Some(BLACK));
    assert_eq!(grid.get_pixel(31, 31), Some(BLACK));
}

#[test]
fn out_of_bounds_writes_are_noops() {
    let mut grid = Grid::new();
    grid.set_pixel(-1, 0, RED);
    grid.set_pixel(0, -1, RED);
    grid.set_pixel(32, 0, RED);
    grid.set_pixel(0, 32, RED);
    grid.set_pixel(i32::MAX, i32::MAX, RED);
    assert_eq!(count_color(&grid, EMPTY_COLOR), 1024);
    assert_eq!(grid.get_pixel(-1, 0), None);
    assert_eq!(grid.get_pixel(32, 32), None);
}

#[test]
fn stroke_undo_redo_restores_snapshots() {
    let mut grid = Grid::new();
    grid.begin_stroke();
    grid.set_pixel(1, 1, RED);
    grid.set_pixel(2, 2, RED);
    grid.end_stroke();
    assert!(grid.can_undo());
    assert!(!grid.can_redo());

    assert!(grid.undo());
    assert_eq!(grid.get_pixel(1, 1), Some(EMPTY_COLOR));
    assert_eq!(grid.get_pixel(2, 2), Some(EMPTY_COLOR));
    assert!(grid.can_redo());

    assert!(grid.redo());
    assert_eq!(grid.get_pixel(1, 1), Some(RED));
    assert_eq!(grid.get_pixel(2, 2), Some(RED));
    assert!(!grid.can_redo());
    assert!(grid.undo());
    assert!(!grid.undo());
}

#[test]
fn new_stroke_clears_redo_stack() {
    let mut grid = Grid::new();
    grid.begin_stroke();
    grid.set_pixel(1, 1, RED);
    grid.end_stroke();

    assert!(grid.undo());
    assert!(grid.can_redo());

    grid.begin_stroke();
    grid.set_pixel(3, 3, BLACK);
    grid.end_stroke();
    assert!(!grid.can_redo());

    assert!(grid.undo());
    assert_eq!(grid.get_pixel(3, 3), Some(EMPTY_COLOR));
    assert_eq!(grid.get_pixel(1, 1), Some(EMPTY_COLOR));
}

#[test]
fn undo_stack_is_capped_at_max_depth() {
    let mut grid = Grid::new();
    // 35 real strokes on distinct in-bounds cells (row-major order).
    for i in 0..35 {
        grid.begin_stroke();
        grid.set_pixel(i % 32, i / 32, RED);
        grid.end_stroke();
    }
    // 35 strokes entered, cap is 30: the 5 oldest snapshots were evicted.
    for _ in 0..30 {
        assert!(grid.undo());
    }
    assert!(!grid.can_undo());
    assert!(!grid.undo());
    // Stroke 4 is the newest surviving stroke; stroke 5 was undone last.
    assert_eq!(grid.get_pixel(4, 0), Some(RED));
    assert_eq!(grid.get_pixel(5, 0), Some(EMPTY_COLOR));
}

#[test]
fn empty_stroke_leaves_no_history() {
    let mut grid = Grid::new();
    // Erasing a blank cell is a net-no-op stroke.
    grid.begin_stroke();
    grid.set_pixel(4, 4, EMPTY_COLOR);
    grid.end_stroke();
    assert!(!grid.can_undo());

    // Drawing then reverting within one stroke is also a no-op.
    grid.begin_stroke();
    grid.set_pixel(4, 4, RED);
    grid.set_pixel(4, 4, EMPTY_COLOR);
    grid.end_stroke();
    assert!(!grid.can_undo());

    // A real stroke still records history.
    grid.begin_stroke();
    grid.set_pixel(4, 4, RED);
    grid.end_stroke();
    assert!(grid.can_undo());
}

#[test]
fn flood_fill_respects_barriers() {
    let mut grid = Grid::new();
    for x in 0..32 {
        grid.set_pixel(x, 10, BLACK);
    }
    grid.flood_fill(0, 0, RED);
    assert_eq!(grid.get_pixel(0, 0), Some(RED));
    assert_eq!(grid.get_pixel(31, 9), Some(RED));
    assert_eq!(grid.get_pixel(5, 10), Some(BLACK));
    assert_eq!(grid.get_pixel(5, 11), Some(EMPTY_COLOR));
    assert_eq!(count_color(&grid, RED), 320);

    // Filling with the same color is a no-op.
    grid.flood_fill(0, 0, RED);
    assert_eq!(count_color(&grid, RED), 320);
}
