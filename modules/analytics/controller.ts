import { getStatsHandler } from "./handler";

export async function getStats(req: any, res: any) {
  try {
    const result = await getStatsHandler();
    if (result.error) {
      let errors;
      try {
        errors = JSON.parse(result.error);
      } catch {
        errors = result.error;
      }
      return res.status(400).json({
        message: "Erro ao buscar estatísticas.",
        errors
      });
    }
    res.status(200).json(result.data);
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ message: "Erro ao obter estatísticas." });
  }
}