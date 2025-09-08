<a name="readme-top"></a>

<div align="center">

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]
</div>

---

# 🛠️ SupResto | Digital Meal Ticketing System

**A comprehensive digital meal ticketing system designed to modernize university canteen operations with QR code integration and offline-first functionality.**
Built with ❤️ by [Chater Marzougui](https://github.com/chater-marzougui).

<br />
<div align="center">
  <a href="https://github.com/chater-marzougui/sup-resto">
     <img src="https://via.placeholder.com/256x256/0ea5e9/ffffff?text=🍽️+SupResto" alt="SupResto Logo" width="256" height="256">
  </a>
  <h3>SupResto</h3>
  <p align="center">
    <strong>Smart Digital Meal Ticketing for University Canteens</strong>
    <br />
    <br />
    <a href="https://github.com/chater-marzougui/sup-resto/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/chater-marzougui/sup-resto/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
      </p>
</div>

<br/>

---

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#-features">Features</a></li>
    <li><a href="#-getting-started">Getting Started</a></li>
    <li><a href="#-installation">Installation</a></li>
    <li><a href="#-usage">Usage</a></li>
    <li><a href="#-configuration">Configuration</a></li>
    <li><a href="#-contributing">Contributing</a></li>
    <li><a href="#-license">License</a></li>
     <li><a href="#-contact">Contact</a></li>
  </ol>
</details>

<div align="right">
  <a href="#readme-top">
    <img src="https://img.shields.io/badge/Back_to_Top-⬆️-blue?style=for-the-badge" alt="Back to Top">
  </a>
</div>

---

## About The Project

**🚀 SupResto** is a comprehensive digital meal ticketing system designed to modernize university canteen operations. Built with Next.js 14, TypeScript, and PostgreSQL, it leverages existing student ID QR codes containing CIN (Citizen Identity Number) to provide secure, efficient, and environmentally-friendly meal management while maintaining full offline functionality. The system features role-based access control, real-time analytics, and multi-language support to serve the diverse needs of university communities.

### 🎯 Key Features

- 🔧 **Digital Meal Tickets**: Replace traditional paper tickets with secure digital alternatives
- 🤖 **QR Code Integration**: Uses existing student ID QR codes for seamless authentication  
- ⚡ **Offline-First Design**: Full functionality during network outages with intelligent sync
- 🌐 **Role-Based Access**: Six distinct user roles (Student, Teacher, Staff, Admin, Visitor, Chef)
- 📝 **Real-Time Analytics**: Kitchen forecasting and comprehensive usage statistics

<div align="right">
  <a href="#readme-top">
    <img src="https://img.shields.io/badge/Back_to_Top-⬆️-blue?style=for-the-badge" alt="Back to Top">
  </a>
</div>

---

## ⚡ Getting Started

### Prerequisites

Before running this project, ensure you have the following installed:
- **Node.js** 18+ and npm/pnpm
- **PostgreSQL** database
- **Git** for version control

### Installation

Follow these steps to get SupResto running locally:

```bash
# Step 1: Clone the repository
git clone https://github.com/chater-marzougui/sup-resto.git

# Step 2: Navigate to the project directory
cd sup-resto

# Step 3: Install dependencies
npm install

# Step 4: Setup environment variables
cp .env.example .env
# Configure your database connection and JWT secrets in .env

# Step 5: Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Step 6: Start development server
npm run dev
```

<div align="right">
  <a href="#readme-top">
    <img src="https://img.shields.io/badge/Back_to_Top-⬆️-blue?style=for-the-badge" alt="Back to Top">
  </a>
</div>

-----

## 📚 Usage

## 📚 Usage

SupResto provides different interfaces for various user roles. Once the development server is running, access the application at `http://localhost:3000`.

### Available User Roles & Pricing

| Role | Access Level | Meal Price | Primary Functions |
|------|-------------|------------|-------------------|
| **Student** | Basic User | 200 millimes | Schedule/cancel meals, check balance, view history |
| **Teacher** | Basic User | 2000 millimes | Same as student with different pricing |
| **Payment Staff** | Staff | N/A | Accept payments, scan QR codes for deposits |
| **Verification Staff** | Staff | N/A | Verify meal times, scan for authentication |
| **Admin** | Full Access | N/A | User management, system configuration |
| **Visitor** | Read-only | N/A | Public information access |

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build && npm run start

# Database operations
npm run db:generate    # Generate new migrations
npm run db:migrate     # Apply migrations
npm run db:seed       # Seed with sample data
npm run db:reset      # Reset database (use with caution)

# View database
npm run db:studio     # Open Drizzle Studio
```

<div align="right">
  <a href="#readme-top">
    <img src="https://img.shields.io/badge/Back_to_Top-⬆️-blue?style=for-the-badge" alt="Back to Top">
  </a>
</div>

-----

## 🪛 Configuration

## 🪛 Configuration

SupResto uses environment variables for configuration. Copy `.env.example` to `.env` and configure the following:

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/sup_resto` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | JWT signing secret | `your-secret-key-here` |
| `NODE_ENV` | Environment mode | `development` or `production` |

### Sample Configuration

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sup_resto"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Development
NODE_ENV="development"

# Optional: Meal System Settings
STUDENT_MEAL_PRICE=200
TEACHER_MEAL_PRICE=2000
MAX_DAILY_MEALS=500
```

<div align="right">
  <a href="#readme-top">
    <img src="https://img.shields.io/badge/Back_to_Top-⬆️-blue?style=for-the-badge" alt="Back to Top">
  </a>
</div>

-----

## 🤝 Contributing

Contributions are what make the open source community amazing\! Any contributions are **greatly appreciated**.

### How to Contribute

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request**

<div align="right">
  <a href="#readme-top">
    <img src="https://img.shields.io/badge/Back_to_Top-⬆️-blue?style=for-the-badge" alt="Back to Top">
  </a>
</div>

-----

## 📃 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="right">
  <a href="#readme-top">
    <img src="https://img.shields.io/badge/Back_to_Top-⬆️-blue?style=for-the-badge" alt="Back to Top">
  </a>
</div>

-----

## 📧 Contact

**Chater Marzougui** - [@chater-marzougui](https://github.com/chater-marzougui) - [![LinkedIn](https://img.shields.io/badge/-LinkedIn-black.svg?style=flat-square&logo=linkedin&colorB=555)](https://www.linkedin.com/in/chater-marzougui-342125299/)

Project Link: [https://github.com/chater-marzougui/sup-resto](https://github.com/chater-marzougui/sup-resto)

-----

## 🙏 Acknowledgments

## 🙏 Acknowledgments

Special thanks to:
- **Next.js Team** for the amazing React framework
- **Vercel** for their deployment platform and development tools  
- **Drizzle Team** for the excellent TypeScript ORM
- **tRPC Team** for end-to-end typesafe APIs
- **TailwindCSS** for the utility-first CSS framework
- University canteen staff who provided insights into daily operations

<div align="right">
  <a href="#readme-top">
    <img src="https://img.shields.io/badge/Back_to_Top-⬆️-blue?style=for-the-badge" alt="Back to Top">
  </a>
</div>

-----

**🍽️ Revolutionizing university dining, one digital ticket at a time.**

---

> 📚 **Developer Note**: For detailed technical documentation, development roadmap, and current implementation status, see [`new-readme.md`](./new-readme.md) which contains comprehensive project architecture details, current features, and development plans.


[contributors-shield]: https://img.shields.io/github/contributors/chater-marzougui/sup-resto.svg?style=for-the-badge
[contributors-url]: https://github.com/chater-marzougui/sup-resto/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/chater-marzougui/sup-resto.svg?style=for-the-badge
[forks-url]: https://github.com/chater-marzougui/sup-resto/network/members
[stars-shield]: https://img.shields.io/github/stars/chater-marzougui/sup-resto.svg?style=for-the-badge
[stars-url]: https://github.com/chater-marzougui/sup-resto/stargazers
[issues-shield]: https://img.shields.io/github/issues/chater-marzougui/sup-resto.svg?style=for-the-badge
[issues-url]: https://github.com/chater-marzougui/sup-resto/issues
[license-shield]: https://img.shields.io/github/license/chater-marzougui/sup-resto.svg?style=for-the-badge
[license-url]: https://github.com/chater-marzougui/sup-resto/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/chater-marzougui-342125299/
