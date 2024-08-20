<p align="center">
  <p align="center">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/chiefdeploy/chief/main/assets/chief-logo-white.png">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/chiefdeploy/chief/main/assets/chief-logo-black.png">
      <img alt="Chief" src="https://raw.githubusercontent.com/chiefdeploy/chief/main/assets/chief-logo-black.png" width="250px">
    </picture>
  </p>

  <p align="center">
    The open source deployment platform for your apps and services.
    <br />
    <a href="https://chiefdeploy.com">Website</a>
    ·
    <a href="https://chiefdeploy.com/discord">Discord</a>
  </p>
</p>

<p align="center">
  <img alt="GitHub Release Date" src="https://img.shields.io/github/v/release/chiefdeploy/chief?sort=date&display_name=release">
</p>

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

## Features

- [x] GitHub App Creation
- [x] Automatic Deployments
- [x] Nixpacks Support
- [x] Redis (Valkey) & Postgres Support
- [x] Deployment Notifications (Discord, Slack, Webhook's)
- [ ] Remote Instances
- [ ] Multi-region Deployments (instance groups)
- [ ] Multi-factor authentication
- [ ] Improved Log Viewer
- [ ] Docker Log Reporting
- [ ] Docker Terminal Access
- [ ] Instance Metrics (Clickhouse ?)
- [ ] Pausing Deployments
- [ ] Improved Environment Variable Editor 
- [ ] Organization Management Features


If you'd like to work on any of these you can open up a pull request. If you need any further help feel free to contact me on our community [Discord](https://chiefdeploy.com/discord).

## Community

If you have any questions or suggestions feel free to reach out on the community Discord: [chiefdeploy.com/discord](https://chiefdeploy.com/discord)