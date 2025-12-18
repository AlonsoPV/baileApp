import * as FileSystem from "expo-file-system";

export type CrashRecord = {
  ts: string;
  isFatal?: boolean;
  name?: string;
  message: string;
  stack?: string;
};

const FILE_NAME = "last_fatal_error.json";

function crashFileUri() {
  // documentDirectory should exist on iOS/Android (Expo FS)
  return `${FileSystem.documentDirectory ?? ""}${FILE_NAME}`;
}

export async function writeLastCrash(rec: CrashRecord) {
  try {
    const uri = crashFileUri();
    if (!uri) return;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(rec, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch {
    // Swallow: never crash while logging a crash
  }
}

export async function readLastCrash(): Promise<CrashRecord | null> {
  try {
    const uri = crashFileUri();
    if (!uri) return null;
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    const txt = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return JSON.parse(txt) as CrashRecord;
  } catch {
    return null;
  }
}

export async function clearLastCrash() {
  try {
    const uri = crashFileUri();
    if (!uri) return;
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}


