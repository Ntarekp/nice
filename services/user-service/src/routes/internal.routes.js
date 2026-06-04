const router = require("express").Router();
const ctrl = require("../controllers/internal.controller");

router.get("/admin-emails", ctrl.listAdminEmails);
router.get("/users/:id", ctrl.getUserBrief);

module.exports = router;
