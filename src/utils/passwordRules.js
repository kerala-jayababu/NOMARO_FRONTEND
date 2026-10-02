// Same rules as the API (AccountService.ValidateNewPassword)
export const PASSWORD_RULES = [
  { key: "length", label: "8 to 50 characters", test: (p) => p.length >= 8 && p.length <= 50 },
  { key: "upper", label: "An upper case letter", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "A lower case letter", test: (p) => /[a-z]/.test(p) },
  { key: "digit", label: "A number", test: (p) => /[0-9]/.test(p) },
  { key: "special", label: "A special character", test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { key: "space", label: "No spaces", test: (p) => p.length > 0 && !/\s/.test(p) },
];

export const isStrongPassword = (password) =>
  PASSWORD_RULES.every((rule) => rule.test(password || ""));
