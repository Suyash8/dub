import { Index } from "@upstash/vector";

let _vectorIndex: Index | undefined;

// Instantiate lazily so `next build` doesn't fail when Upstash Vector isn't configured.
export const vectorIndex = new Proxy({} as Index, {
  get(_target, prop) {
    if (!_vectorIndex) {
      _vectorIndex = new Index({
        url: process.env.UPSTASH_VECTOR_REST_URL ?? "",
        token: process.env.UPSTASH_VECTOR_REST_TOKEN ?? "",
      });
    }
    const value = Reflect.get(_vectorIndex, prop, _vectorIndex);
    return typeof value === "function" ? value.bind(_vectorIndex) : value;
  },
});
