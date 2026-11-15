class Inventory:
    def __init__(self, clock=None, ttl=None):
        self.stock = {}
        self.reservations = {}   # id -> (sku, qty, expires_at or None)
        self.next_id = 1
        self.clock, self.ttl = clock, ttl

    def _expiring(self):
        return self.clock is not None and self.ttl is not None

    def _sweep(self):
        if not self._expiring():
            return
        now = self.clock()
        for rid in [r for r, (_, _, exp) in self.reservations.items() if now >= exp]:
            del self.reservations[rid]

    def add(self, sku, qty):
        self.stock[sku] = self.stock.get(sku, 0) + qty

    def reserve(self, sku, qty):
        if self.available(sku) < qty:
            return -1
        rid = self.next_id
        self.next_id += 1
        self.reservations[rid] = (sku, qty, self.clock() + self.ttl if self._expiring() else None)
        return rid

    def release(self, rid):
        self._sweep()
        self.reservations.pop(rid, None)

    def commit(self, rid):
        self._sweep()
        if rid not in self.reservations:
            return False
        sku, qty, _ = self.reservations.pop(rid)
        self.stock[sku] -= qty
        return True

    def available(self, sku):
        self._sweep()
        held = sum(q for s, q, _ in self.reservations.values() if s == sku)
        return self.stock.get(sku, 0) - held
