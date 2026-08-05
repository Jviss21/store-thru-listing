/**
 * Optional peer — install with `npm i @vercel/blob` when using BLOB_READ_WRITE_TOKEN.
 * Dynamic import in photo-storage.ts; this ambient module keeps typecheck green without the package.
 */
declare module "@vercel/blob" {
  export function put(
    pathname: string,
    body: Buffer | Blob | ArrayBuffer | string,
    options: {
      access: "public" | "private";
      contentType?: string;
      token?: string;
    }
  ): Promise<{ url: string; pathname: string }>;
}
