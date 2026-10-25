import { useAsync } from "./useAsync";
import { json } from "../api/services";
export function useCulture() {
  return useAsync(async () => {
    const [base, extra] = await Promise.all([
      json(import.meta.env.BASE_URL + "data/culture.json"),
      json(import.meta.env.BASE_URL + "data/languages.json"),
    ]);
    return {
      ...base,
      language: {
        ...base.language,
        spoken: [...base.language.spoken, ...extra.spoken],
      },
    };
  }, []);
}
