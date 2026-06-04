const router = require("express").Router();
const ctrl = require("../controllers/report.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.use(authenticate);
router.use(authorize("admin", "inspector"));
router.get("/dashboard", ctrl.dashboard);
router.get("/export", ctrl.export);

module.exports = router;
