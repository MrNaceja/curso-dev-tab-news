export default function handle(req, res) {
  if (req.method !== "GET") res.status(405).send();

  res.status(200).json({ ok: true });
}
