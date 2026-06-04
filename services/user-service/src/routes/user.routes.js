const router = require("express").Router();
const ctrl = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

router.use(authenticate);

router.get("/audit-logs", authorize("admin"), ctrl.getAuditLogs);
router.get("/me", ctrl.getUser);
router.patch("/me", ctrl.updateUser);

router.post(
  "/",
  authorize("admin"),
  [
    body("firstName").trim().isLength({ min: 2, max: 50 }),
    body("lastName").trim().isLength({ min: 2, max: 50 }),
    body("email").isEmail().normalizeEmail(),
    body("role").isIn(["admin", "inspector", "user"]),
  ],
  validate,
  ctrl.createUser
);

router.get("/", authorize("admin"), ctrl.listUsers);
router.get("/:id", authorize("admin"), ctrl.getUser);
router.patch("/:id", ctrl.updateUser);
router.delete("/:id", authorize("admin"), ctrl.deleteUser);

module.exports = router;
