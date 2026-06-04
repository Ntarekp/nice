const router = require("express").Router();
const ctrl   = require("../controllers/maintenance.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { body, validationResult } = require("express-validator");

const v = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(422).json({ errors: e.array() });
  next();
};

router.use(authenticate);
router.get("/",  ctrl.listMaintenance);
router.post("/", authorize("admin","inspector"), [
  body("extinguisherId").isUUID(),
  body("actionDate").isDate(),
  body("actionsTaken").trim().notEmpty()
], v, ctrl.logMaintenance);
module.exports = router;