import { NodeSSH } from "node-ssh";

export async function test_instance_key(
  ip: string,
  username: string,
  key: string
) {
  const ssh = new NodeSSH();

  await ssh.connect({
    host: ip,
    username: username,
    privateKey: Buffer.from(key, "base64").toString("utf-8"),
    readyTimeout: 5000
  });

  const { stdout, stderr, code } = await ssh.execCommand("sudo uname -a");

  await ssh.dispose();

  if (code !== 0) {
    return false;
  }

  if (!stdout) {
    return false;
  }

  if (stderr) {
    return false;
  }

  return true;
}

export async function setup_instance(
  ip: string,
  username: string,
  key: string
) {
  console.log("started setup instance");

  const ssh = new NodeSSH();

  async function send_command(command: string) {
    await ssh.connect({
      host: ip,
      username: username,
      privateKey: Buffer.from(key, "base64").toString("utf-8")
    });

    const { stdout, stderr, code } = await ssh.execCommand(command);

    await ssh.dispose();

    return {
      ok: stdout.toString() || stderr.toString(),
      error: code !== 0 ? stderr.toString() : false
    };
  }

  const { ok: connected, error: connected_error } =
    await send_command("uname -a");

  if (connected_error) {
    console.log({
      error: "failed_to_connect"
    });
    return false;
  }

  return true;
}
