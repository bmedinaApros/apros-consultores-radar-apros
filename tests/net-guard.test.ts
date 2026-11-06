import { describe, expect, it } from "vitest";
import { BlockedError, blockedReason, isPublicIp, resolveAndValidate, validateUrl, type Resolver } from "@/lib/analyzer/net-guard";

describe("IPv4: rangos bloqueados", () => {
  const blocked = [
    "0.0.0.0", "0.1.2.3", "10.0.0.1", "10.255.255.255", "100.64.0.1", "100.127.255.255", "127.0.0.1", "127.255.255.254",
    "169.254.169.254", "169.254.0.1", "172.16.0.1", "172.31.255.255", "192.0.0.1", "192.0.2.1", "192.168.0.1", "192.168.255.255",
    "198.18.0.1", "198.19.255.255", "198.51.100.1", "203.0.113.1", "224.0.0.1", "239.255.255.255", "240.0.0.1", "255.255.255.255",
  ];
  it.each(blocked)("bloquea %s", (ip) => expect(blockedReason(ip)).not.toBeNull());

  const allowed = ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.15.255.255", "172.32.0.1", "100.63.255.255", "100.128.0.1", "198.17.255.255", "198.20.0.1", "11.0.0.1", "126.255.255.255", "128.0.0.1", "223.255.255.255"];
  it.each(allowed)("permite %s", (ip) => expect(isPublicIp(ip)).toBe(true));
});

describe("IPv6: rangos bloqueados", () => {
  const blocked = [
    "::", "::1", "0:0:0:0:0:0:0:1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:10.0.0.1", "::ffff:a9fe:a9fe", "::ffff:169.254.169.254",
    "::127.0.0.1", "64:ff9b::7f00:1", "64:ff9b::a00:1", "64:ff9b::169.254.169.254", "64:ff9b:1::1", "2002:7f00:1::1", "2002:a9fe:a9fe::1", "2002:0a00:0001::",
    "2001::1", "2001:db8::1", "2001:10::1", "fe80::1", "febf::1", "fc00::1", "fd00:ec2::254", "fdff::1", "ff02::1", "ff00::", "100::1",
    "3fff::1", "1::1", "4000::1", "8000::1", "e000::1",
  ];
  it.each(blocked)("bloquea %s", (ip) => expect(blockedReason(ip)).not.toBeNull());

  const allowed = ["2606:4700:4700::1111", "2001:4860:4860::8888", "2a00:1450:4001:81b::200e", "::ffff:8.8.8.8", "64:ff9b::808:808", "2002:808:808::1"];
  it.each(allowed)("permite %s", (ip) => expect(blockedReason(ip)).toBeNull());

  it("rechaza zonas y formatos inválidos", () => {
    expect(blockedReason("fe80::1%eth0")).not.toBeNull();
    expect(blockedReason("1:2:3:4:5:6:7:8:9")).not.toBeNull();
    expect(blockedReason("hola")).not.toBeNull();
    expect(blockedReason("999.1.1.1")).not.toBeNull();
  });
});

describe("validateUrl", () => {
  const bad = (u: string, ports?: number[]) => { try { validateUrl(u, ports); return null; } catch (e) { return e instanceof BlockedError ? e.reason : "otro error"; } };

  it("acepta URLs públicas http y https", () => {
    expect(validateUrl("https://www.ejemplo.pe/ruta?x=1").hostname).toBe("www.ejemplo.pe");
    expect(validateUrl("http://ejemplo.pe").port).toBe(80);
    expect(validateUrl("https://ejemplo.pe").port).toBe(443);
    expect(validateUrl("https://EJEMPLO.PE./").hostname).toBe("ejemplo.pe");
  });

  it.each([
    "file:///etc/passwd", "ftp://ejemplo.pe", "gopher://ejemplo.pe", "javascript:alert(1)", "data:text/html,hola", "ws://ejemplo.pe", "dict://ejemplo.pe:11211/",
  ])("rechaza el esquema de %s", (u) => expect(bad(u)).toMatch(/esquema|inválida/));

  it.each([
    "http://127.0.0.1", "http://localhost", "http://LOCALHOST/", "http://foo.localhost", "http://[::1]/", "http://[::ffff:127.0.0.1]/", "http://[::ffff:7f00:1]/",
    "http://169.254.169.254/latest/meta-data/", "http://metadata.google.internal/", "http://10.0.0.5", "http://192.168.1.1",
    "http://2130706433/", "http://0x7f000001/", "http://0x7f.1/", "http://127.1/", "http://0177.0.0.1/", "http://017700000001/", "http://0/", "http://0.0.0.0/",
    "http://[fd00:ec2::254]/", "http://[fe80::1]/", "http://servidor.internal/", "http://impresora.local/", "http://intranet/",
    "http://[2002:7f00:1::1]/", "http://[64:ff9b::7f00:1]/", "http://1.1.1.1.nip.io.localhost/",
  ])("rechaza el destino interno %s", (u) => expect(bad(u)).not.toBeNull());

  it("rechaza credenciales, puertos no permitidos y URLs enormes", () => {
    expect(bad("https://usuario:clave@ejemplo.pe/")).toMatch(/credenciales/);
    expect(bad("https://usuario@ejemplo.pe/")).toMatch(/credenciales/);
    expect(bad("http://ejemplo.pe:22/")).toMatch(/puerto/);
    expect(bad("http://ejemplo.pe:6379/")).toMatch(/puerto/);
    expect(bad("https://ejemplo.pe:8443/")).toMatch(/puerto/);
    expect(bad("https://ejemplo.pe:8443/", [80, 443, 8443])).toBeNull();
    expect(bad("https://ejemplo.pe/" + "a".repeat(3000))).toMatch(/larga/);
  });

  it("no confunde el host con trucos de URL", () => {
    // «ejemplo.pe@evil.com» apunta en realidad a evil.com con usuario «ejemplo.pe»: se rechaza por credenciales.
    expect(bad("https://ejemplo.pe@evil.com")).toMatch(/credenciales/);
    expect(bad("https://ejemplo.pe%40evil.com@127.0.0.1")).not.toBeNull();
    expect(validateUrl("https://evil.com#@ejemplo.pe").hostname).toBe("evil.com");
  });
});

describe("resolveAndValidate", () => {
  const fixed = (...addrs: string[]): Resolver => async () => addrs.map((a) => ({ address: a, family: a.includes(":") ? 6 : 4 }));

  it("devuelve la dirección pública validada", async () => {
    expect(await resolveAndValidate("ejemplo.pe", fixed("93.184.216.34"))).toEqual({ address: "93.184.216.34", family: 4 });
  });

  it("rechaza si resuelve a una dirección privada o de metadatos", async () => {
    await expect(resolveAndValidate("malo.pe", fixed("10.0.0.1"))).rejects.toBeInstanceOf(BlockedError);
    await expect(resolveAndValidate("malo.pe", fixed("169.254.169.254"))).rejects.toBeInstanceOf(BlockedError);
    await expect(resolveAndValidate("malo.pe", fixed("::1"))).rejects.toBeInstanceOf(BlockedError);
    await expect(resolveAndValidate("malo.pe", fixed("::ffff:192.168.0.1"))).rejects.toBeInstanceOf(BlockedError);
  });

  it("rechaza una respuesta mixta (una pública y una privada)", async () => {
    await expect(resolveAndValidate("mixto.pe", fixed("93.184.216.34", "127.0.0.1"))).rejects.toBeInstanceOf(BlockedError);
    await expect(resolveAndValidate("mixto.pe", fixed("127.0.0.1", "93.184.216.34"))).rejects.toBeInstanceOf(BlockedError);
  });

  it("rechaza dominios sin direcciones, con error de DNS o que tardan demasiado", async () => {
    await expect(resolveAndValidate("vacio.pe", fixed())).rejects.toThrow(/no tiene direcciones/);
    await expect(resolveAndValidate("nx.pe", async () => { throw Object.assign(new Error("x"), { code: "ENOTFOUND" }); })).rejects.toThrow(/ENOTFOUND/);
    await expect(resolveAndValidate("lento.pe", () => new Promise(() => {}), 50)).rejects.toThrow(/tiempo de espera/);
  });

  it("una IP literal se valida sin consultar el DNS", async () => {
    let calls = 0;
    const r: Resolver = async () => { calls++; return []; };
    await expect(resolveAndValidate("127.0.0.1", r)).rejects.toBeInstanceOf(BlockedError);
    expect(await resolveAndValidate("8.8.8.8", r)).toEqual({ address: "8.8.8.8", family: 4 });
    expect(calls).toBe(0);
  });
});
