import assert from "node:assert/strict";
import test from "node:test";
import { buildTransferDays } from "../src/modules/biblia/transferDays.ts";

test("crea un servicio por fecha y conserva los días existentes", () => {
  const initial = buildTransferDays("2026-09-17", "2026-09-19", []);
  assert.deepEqual(initial.map((day) => day.fecha), [
    "2026-09-17", "2026-09-18", "2026-09-19",
  ]);
  initial[1].destino = "Aeropuerto Jorge Chávez";
  initial[1].detalle = "Aeropuerto al hotel";
  const changed = buildTransferDays("2026-09-18", "2026-09-20", initial);
  assert.equal(changed[0].destino, "Aeropuerto Jorge Chávez");
  assert.equal(changed[0].detalle, "Aeropuerto al hotel");
  assert.equal(changed[2].fecha, "2026-09-20");
  assert.equal(buildTransferDays("2026-09-17", "", []).length, 1);
});
