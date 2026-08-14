const PROMPTPAY_AID = "A000000677010111";
const CURRENCY_THB = "764";

function format(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16CcittFalse(input: string) {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i += 1) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function cleanTarget(target: string) {
  return target.replace(/\D/g, "");
}

function promptPayTargetTag(target: string) {
  const cleaned = cleanTarget(target);
  if (cleaned.length >= 15) return { tag: "03", value: cleaned };
  if (cleaned.length >= 13) return { tag: "02", value: cleaned };
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return { tag: "01", value: `0066${cleaned.slice(1)}` };
  }
  return { tag: "01", value: cleaned };
}

export function createPromptPayPayload(target: string, amount: number) {
  const { tag, value } = promptPayTargetTag(target);
  const merchantAccount = format("00", PROMPTPAY_AID) + format(tag, value);
  const body = [
    format("00", "01"),
    format("01", amount > 0 ? "12" : "11"),
    format("29", merchantAccount),
    format("58", "TH"),
    format("53", CURRENCY_THB),
    amount > 0 ? format("54", amount.toFixed(2)) : ""
  ].join("");
  const payloadWithoutCrc = `${body}6304`;
  return `${payloadWithoutCrc}${crc16CcittFalse(payloadWithoutCrc)}`;
}

export const domichaPromptPay = {
  target: "0205567033352",
  accountName: "บริษัท โดมิพลัสกรุ๊ป จำกัด"
};
