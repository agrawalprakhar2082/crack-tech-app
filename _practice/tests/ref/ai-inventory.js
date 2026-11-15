class Inventory {
    constructor(clock = null, ttl = null) {
        this.stock = new Map();
        this.reservations = new Map();   // id -> [sku, qty, expiresAt]
        this.nextId = 1;
        this.clock = clock; this.ttl = ttl;
    }
    expiring() { return this.clock != null && this.ttl != null; }
    sweep() {
        if (!this.expiring()) return;
        const now = this.clock();
        for (const [rid, r] of [...this.reservations]) if (now >= r[2]) this.reservations.delete(rid);
    }
    add(sku, qty) { this.stock.set(sku, (this.stock.get(sku) || 0) + qty); }
    reserve(sku, qty) {
        if (this.available(sku) < qty) return -1;
        const rid = this.nextId++;
        this.reservations.set(rid, [sku, qty, this.expiring() ? this.clock() + this.ttl : null]);
        return rid;
    }
    release(rid) { this.sweep(); this.reservations.delete(rid); }
    commit(rid) {
        this.sweep();
        if (!this.reservations.has(rid)) return false;
        const [sku, qty] = this.reservations.get(rid);
        this.reservations.delete(rid);
        this.stock.set(sku, this.stock.get(sku) - qty);
        return true;
    }
    available(sku) {
        this.sweep();
        let held = 0;
        for (const [s, q] of this.reservations.values()) if (s === sku) held += q;
        return (this.stock.get(sku) || 0) - held;
    }
}
