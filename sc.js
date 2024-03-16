import web3 from "@solana/web3.js";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();
const webHookUrl = process.env.DISCORD_WEBHOOK;
const discordClient = new WebhookClient({
  url: webHookUrl,
});

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const connection = new web3.Connection(rpcUrl, "confirmed");

  const programId = new web3.PublicKey(process.env.TASK_ID);
  const accountInfo = await connection.getAccountInfo(programId);

  if (accountInfo && accountInfo.data) {
    // Assuming accountInfo.data is a Buffer containing the JSON string
    const accountDataString = accountInfo.data.toString("utf-8");
    const accountData = JSON.parse(accountDataString.trim()); // Parse the JSON string

    // The public key you're interested in

    const pubKeys = process.env.PUBLIC_KEYS.split(",");

    pubKeys.forEach(async (publicKey) => {
      const availableBalance = accountData.available_balances
        ? accountData.available_balances[publicKey]
        : undefined;

      let fields = [
        {
          name: "Address",
          value: publicKey,
        },
      ];
      if (availableBalance !== undefined) {
        fields.push({
          name: "Available balance",
          value: String(parseInt(availableBalance) / 1000000000),
        });
      } else {
        fields.push({
          name: "Available balance",
          value: "Not found in rewards.",
        });
      }

      // Check in stake_list
      const stakeListBalance = accountData.stake_list
        ? accountData.stake_list[publicKey]
        : undefined;
      if (stakeListBalance !== undefined) {
        fields.push({
          name: "Staked Balance",
          value: String(parseInt(stakeListBalance) / 1000000000),
        });
      } else {
        fields.push({
          name: "Staked Balance",
          value: "Not found in stake list",
        });
        console.log(`Public key ${publicKey} not found in stake list.`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`Updatebalace`)
        .setColor(16711680 /* red https://www.spycolor.com/ff0000 */)
        .addFields(fields)
        .setFooter({ text: "DONE" });

      await discordClient.send({ embeds: [embed] });
    });

    // Check in available_balances
  } else {
    console.log("Failed to find account information.");
  }
}

await main();
