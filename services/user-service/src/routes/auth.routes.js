const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const {
  authenticate,
  optionalAuthenticate,
} = require("../middleware/auth.middleware");
const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

router.post(
  "/register",
  [
    body("firstName").trim().isLength({ min: 2, max: 50 }),
    body("lastName").trim().isLength({ min: 2, max: 50 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
  ],
  validate,
  ctrl.register
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  ctrl.login
);

router.post(
  "/verify-otp",
  [
    body("userId").isUUID(),
    body("otp").isLength({ min: 6, max: 6 }).isNumeric(),
    body("purpose").optional().isIn(["register", "login"]),
  ],
  validate,
  ctrl.verifyOtp
);

router.post("/refresh-token", ctrl.refreshToken);
router.post("/refresh", ctrl.refreshToken);

router.post("/logout", optionalAuthenticate, ctrl.logout);

router.post(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 8 }),
  ],
  validate,
  ctrl.changePassword
);

router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail()],
  validate,
  ctrl.forgotPassword
);

router.post(
  "/reset-password",
  [
    body("email").isEmail().normalizeEmail(),
    body("otp").isLength({ min: 6, max: 6 }).isNumeric(),
    body("newPassword").isLength({ min: 8 }),
  ],
  validate,
  ctrl.resetPassword
);

module.exports = router;
