import boundaries from "eslint-plugin-boundaries";

export default [
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "config", pattern: "src/config/*" },
        { type: "shared", pattern: "src/shared/*" },
        { type: "core", pattern: "src/core/*" },
        { type: "platform", pattern: "src/platform/*" },
        { type: "middleware", pattern: "src/middleware/*" },
        { type: "modules", pattern: "src/modules/*" },
        { type: "jobs", pattern: "src/jobs/*" },
        { type: "bootstrap", pattern: "src/bootstrap/*" },
      ],
    },
    rules: {
      "boundaries/element-types": [
        2,
        {
          default: "disallow",
          rules: [
            { from: "config", allow: [] },
            { from: "shared", allow: [] },
            { from: "core", allow: ["config", "shared"] },
            { from: "platform", allow: ["config", "shared", "core"] },
            {
              from: "middleware",
              allow: ["config", "shared", "core", "platform"],
            },
            {
              from: "modules",
              allow: ["config", "shared", "core", "platform", "middleware", "modules"],
            },
            { from: "jobs", allow: ["config", "shared", "core", "platform", "modules"] },
            { from: "bootstrap", allow: ["*"] },
          ],
        },
      ],
    },
  },
];