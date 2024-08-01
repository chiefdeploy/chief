<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/chiefdeploy/chief/main/assets/chief-logo-white.png">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/chiefdeploy/chief/main/assets/chief-logo-black.png">
  <img alt="Chief" src="https://raw.githubusercontent.com/chiefdeploy/chief/main/assets/chief-logo-black.png">
</picture>

# Chief

> This repo is very messy, I'm currently working on cleaning it up.

Chief is a deployment platform that allows you to deploy your apps and services to any cloud provider.

## Installation

To get started, you'll need a clean VPS with atleast 4GB of RAM, around 30-50GB of disk space (depending on how many projects you'll host on it), 2 vCPUs, a public IP address, and a domain name pointing at your VPS such as `hosting.example.com`.

You need to SSH into your VPS as root, and run the following command:

```bash
curl -fsSL https://install.chiefdeploy.com | sudo bash
```

This will install Docker, Docker Compose, and the Chief CLI which will initialize Chief on your VPS. We recommend you enable automatic updates during the installation process.

## Usage

Once Chief is installed, you'll be instructed to go to a URL (this will be your choosen domain for the Chief instance) and setup your instance.

After you've setup your instance, you should create a new source in the Sources tab on the dashboard, this will let Chief pull your GitHub repositories and build your projects.

Once you've created a source, you can create a new project by clicking the "New Project" button on the dashboard, this will let you create a new project from your GitHub repository.

## Updating Chief

If the Chief CLI is already installed, you can update it by running the following command:

```bash
chief update
```

This will update Chief to the latest stable version.

## Contributing

If you'd like to contribute to Chief, please feel free to open an issue or pull request on the GitHub repository.

## Community

If you have any questions feel free to reach out on the community Discord: [chiefdeploy.com/discord](https://chiefdeploy.com/discord)