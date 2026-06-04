const router = require("express").Router();
const ctrl = require("../controllers/report.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);
router.get("/dashboard", ctrl.dashboard);
router.get("/export", ctrl.export);

module.exports = router;
