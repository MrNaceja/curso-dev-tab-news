import database from "infra/database.js";

export default async function (req, res) {
  switch (req.method) {
    case "GET":
      return await GET(req, res);
    default:
      return res.status(405).send();
  }
}

async function GET(req, res) {
  const result = await database.query("select 1 + 1 as sum;");
  res.status(200).json({ ok: true });
}
