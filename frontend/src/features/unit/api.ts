import {
  CreateUnit,
  GetAllUnits,
  GetUnitById,
  UpdateUnit,
} from "../../../wailsjs/go/unit/UnitApi";

export const unitApi = {
  getAllUnits: GetAllUnits,
  getUnitById: GetUnitById,
  createUnit: CreateUnit,
  updateUnit: UpdateUnit,
};
