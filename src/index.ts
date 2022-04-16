import {Client, ClientOptions, MessageEmbed} from "discord.js";
import {readFileSync, existsSync} from "fs";
import {join} from "path";
import betterLogging from "better-logging";
import axios from "axios";
betterLogging(console);

type Rule = {
	id: number;
	immutable: boolean;
	content: string;
	previous?: number[];
	author?: string;
};

if (!existsSync(join(__dirname, "../config.json"))) {
	throw new Error("No config.json found");
}

const {token} = JSON.parse(
	readFileSync(join(__dirname, "../config.json"), "utf8")
);

let ruleset: Rule[] = [];
axios("https://e.elithecoder.com/nomic/ruleset.json").then(res => {
	ruleset = res.data;
});

let scoreboard: {[key: string]: number} = {};
axios("https://e.elithecoder.com/nomic/scoreboard.json").then(res => {
	scoreboard = res.data;
});

// const commands = [
// 	new SlashCommandBuilder()
// 		.setName("ping")
// 		.setDescription("Replies with pong"),
// 	new SlashCommandBuilder()
// 		.setName("scoreboard")
// 		.setDescription("Replies with the curreent scoreboard"),
// 	new SlashCommandBuilder()
// 		.setName("rule")
// 		.setDescription("Replies with the requested rule")
// 		.addIntegerOption(option =>
// 			option
// 				.setName("id")
// 				.setDescription("The ordinal number of the rule")
// 		)
// ].map(command => command.toJSON());

// const rest = new REST({version: "9"}).setToken(token);

const client = new Client({intents: []} as ClientOptions);

client.once("ready", () => {
	console.info("Bot is ready.");
});

client.on("interactionCreate", async interaction => {
	if (!interaction.isCommand()) return;

	switch (interaction.commandName) {
		case "ping": {
			interaction.reply(`Pong! (${client.ws.ping}ms)`);
			break;
		}
		case "scoreboard": {
			const maxLength = Object.keys(scoreboard).reduce(
				(acc, key, ind) =>
					Math.max(
						acc,
						key.length +
							Object.values(scoreboard)[ind].toString().length
					),
				0
			);
			const embed = new MessageEmbed()
				.setTitle("Scoreboard")
				.setDescription(
					`\`\`\`${Object.entries(scoreboard)
						.map(
							([key, value]) =>
								`${key} ${value
									.toString()
									.padStart(maxLength - key.length + 1, " ")}`
						)
						.join("\n")}\`\`\``
				);
			interaction.reply({embeds: [embed]});
			break;
		}
		case "rule": {
			const id = interaction.options.getInteger("id");
			const rule = ruleset.find(rule => rule.id === id);

			if (rule === undefined) {
				interaction.reply("Rule not found");
			} else {
				const embed = new MessageEmbed()
					.setTitle(`${rule.immutable ? "🔒 " : ""}${rule.id}`)
					.setDescription(rule.content)
					.setFooter({
						text: `${rule.author ? `Author: ${rule.author}` : ""}`
					});
				interaction.reply({embeds: [embed]});
			}
			break;
		}
	}
});

client.login(token);
