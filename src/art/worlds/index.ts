/** Loads every world file (w_*.ts); each registers itself with registerWorld(). */
import.meta.glob('./w_*.ts', { eager: true });
export {};
