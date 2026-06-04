const router = require("express").Router();
const ctrl   = require("../controllers/inspection.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { body, validationResult } = require("express-validator");

const v = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(422).json({ errors: e.array() });
  next();
};

router.use(authenticate);
router.get("/",    ctrl.list);
router.get("/:id", ctrl.getById);
router.post(
  "/",
  authorize("user"),
  [
    body("extinguisherId").isUUID(),
    body("scheduledDate").isISO8601().withMessage("Valid datetime required"),
  ],
  v,
  ctrl.schedule
);
router.patch("/:id", authorize("inspector"), ctrl.update);
module.exports = router;