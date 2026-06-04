const router = require("express").Router();
const ctrl = require("../controllers/extinguisher.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(422).json({ errors: e.array() });
  next();
};

router.use(authenticate);
router.get("/stats/summary", ctrl.summary);
router.get("/lookup/:serialNumber", ctrl.getBySerial);
router.get("/", ctrl.list);
router.get("/:id", ctrl.getById);

router.post(
  "/",
  authorize("user"),
  [
    body("serialNumber").trim().notEmpty().withMessage("Serial number required"),
    body("location").trim().notEmpty().withMessage("Location required"),
    body("type").isIn(["water", "co2", "foam", "dry_chemical", "wet_chemical", "halon"]),
    body("size").isIn(["2.5lbs", "5lbs", "9lbs", "12lbs", "20lbs"]),
    body("installationDate").isDate().withMessage("Valid installation date required"),
    body("expiryDate").isDate().withMessage("Valid expiry date required"),
  ],
  validate,
  ctrl.create
);

router.patch("/:id", authorize("inspector"), ctrl.update);

module.exports = router;
