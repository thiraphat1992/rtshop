function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(tag: string, value: string): string {
  return `${tag}${value.length.toString().padStart(2, "0")}${value}`;
}

export function buildPromptPayPayload(promptPayId: string, amount?: number): string {
  let id = promptPayId.replace(/[-\s]/g, "");
  const isNationalId = /^\d{13}$/.test(id);
  if (!isNationalId) {
    // Phone number → PromptPay format: 0066XXXXXXXXX (NITMX standard)
    if (id.startsWith("0")) {
      id = "0066" + id.slice(1);           // 0XXXXXXXXX → 0066XXXXXXXXX
    } else if (id.startsWith("+66")) {
      id = "0066" + id.slice(3);           // +66XXXXXXXXX → 0066XXXXXXXXX
    } else if (id.startsWith("66")) {
      id = "0066" + id.slice(2);           // 66XXXXXXXXX → 0066XXXXXXXXX
    } else {
      id = "0066" + id;
    }
  }

  const pointOfInitiation = tlv("01", amount !== undefined ? "12" : "11");
  const merchantAcctInfo = tlv("00", "A000000677010111") + tlv("01", id);
  const merchantAccount = tlv("29", merchantAcctInfo);
  const amountTlv = amount !== undefined ? tlv("54", amount.toFixed(2)) : "";

  const payload =
    tlv("00", "01") +
    pointOfInitiation +
    merchantAccount +
    tlv("52", "0000") +
    tlv("53", "764") +
    amountTlv +
    tlv("58", "TH") +
    "6304";

  return payload + crc16(payload);
}
