const router = require("express").Router();
const ctrl   = require("../controllers/maintenance.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { body, validationResult } = require("express-validator");

const v = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) {
    const errors = e.array();
    return res.status(422).json({
      error: errors[0]?.msg || "Validation failed",
      errors,
    });
  }
  next();
};

router.use(authenticate);
router.get("/",  ctrl.listMaintenance);
router.post("/", authorize("inspector"), [
  body("extinguisherId").isUUID().withMessage("Select a valid extinguisher"),
  body("inspectionId").optional({ values: "falsy" }).isUUID(),
  body("actionDate")
    .isISO8601({ strict: false })
    .withMessage("Valid action date required (YYYY-MM-DD)"),
  body("actionsTaken").trim().notEmpty().withMessage("Actions taken is required"),
  body("conditionsNoted").optional({ values: "falsy" }).trim(),
  body("cost").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("Cost must be a number"),
  body("nextServiceDate")
    .optional({ values: "falsy" })
    .isISO8601({ strict: false })
    .withMessage("Invalid next service date"),
  body("status")
    .optional()
    .isIn(["completed", "pending_parts", "decommissioned"]),
], v, ctrl.logMaintenance);
module.exports = router;