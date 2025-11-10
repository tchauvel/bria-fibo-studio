# 🎨 Bria FIBO Studio

### *Photography Style Transfer Platform*

> **Transform your visual creativity.** Extract the photographic DNA from any image and apply it to entirely new subjects—preserving lighting, mood, and atmosphere with precision.

---

## ✨ What is FIBO Studio?

FIBO Studio is an **AI-powered photography style transfer platform** that lets photographers, artists, and creative professionals capture the essence of their visual style and apply it to new creations.

Think of it as **Photoshop meets AI**—but instead of manual adjustments, you teach the system your style once, and it recreates it perfectly across unlimited new subjects.

### 🎯 Perfect For

- **📸 Photographers** - Maintain consistent style across client shoots
- **🎨 Digital Artists** - Apply your signature look to new compositions
- **🏢 Creative Agencies** - Scale brand visual identity effortlessly
- **🛍️ E-commerce** - Generate on-brand product imagery at scale
- **🎬 Content Creators** - Achieve cinematic consistency across projects

---

## 🚀 Key Features

### 🧬 **Style DNA Extractor**

Upload your reference images and let our AI extract the *visual DNA*—lighting characteristics, color palettes, mood, atmosphere, and technical details.

**What makes it special:**
- **Smart parsing** - Isolates style attributes from scene content
- **Auto-naming** - Generates descriptive profile names automatically
- **Flexible input** - Works with 1-20 reference images
- **Persistent storage** - Profiles saved locally for instant reuse

### 🖼️ **Image Generator**

Apply your extracted styles to completely new subjects with surgical precision.

**What makes it special:**
- **True style transfer** - Preserves atmosphere without recreating scenes
- **Multi-generation** - Create up to 6 variations in one click
- **Seed control** - Reproduce or vary results with seed-based generation
- **Real-time preview** - See your style DNA in action instantly

### 🎛️ **Advanced Controls**

Fine-tune your generations with professional-grade parameters:
- **Lighting inheritance** - Conditions, quality, time of day
- **Color fidelity** - Precise palette matching
- **Mood preservation** - Emotional tone transfer
- **Technical replication** - Depth of field, focus, camera characteristics

---

## 🎬 How It Works

### 1️⃣ **Extract** - Upload Your Style References
Drop in your favorite images—could be from a photoshoot, a film still, or any visual reference that captures your desired aesthetic.

### 2️⃣ **Analyze** - AI Learns Your Visual DNA
Our Style DNA Parser analyzes lighting, colors, mood, atmosphere, and technical characteristics while intelligently filtering out scene-specific content.

### 3️⃣ **Generate** - Create New Images
Describe any subject you want, select your style profile, and generate perfectly styled images that maintain your visual identity.

---

## 💡 Use Cases

### 🏪 **E-commerce Product Photography**
Extract style from your hero shots → Generate hundreds of on-brand product images

### 📱 **Social Media Consistency**
Maintain a cohesive visual feed → Apply your signature style to every post

### 🎥 **Film & Video Stills**
Capture a cinematic look → Reproduce it across concept art and promotional materials

### 🖼️ **Artistic Projects**
Define your artistic voice → Explore new subjects without losing your style

### 🏢 **Brand Identity**
Document your brand's visual DNA → Ensure consistency across all creative output

---

## 🛠️ Technical Stack

Built with modern, production-ready technologies:

**Frontend**
- ⚡️ **Next.js 14** - React framework with App Router
- 🎨 **Tailwind CSS** - Utility-first styling
- ✨ **Framer Motion** - Smooth animations
- 💾 **Local Storage** - Client-side persistence

**Backend**
- 🚀 **Node.js + Express** - Fast, scalable API
- 📘 **TypeScript** - Type-safe development
- ✅ **Zod** - Runtime validation
- 🔄 **Retry Logic** - Robust error handling

**AI Engine**
- 🧠 **Bria API v2** - Structured prompt generation
- 🎯 **Style DNA Parser** - Intelligent attribute extraction
- 🌱 **Seed-based Generation** - Reproducible variations

---

## 🚀 Quick Start

### Prerequisites
```bash
node -v  # v18 or higher
npm -v   # v9 or higher
```

### Installation

```bash
# Clone the repository
git clone https://github.com/tchauvel/bria-fibo-studio.git
cd bria-fibo-studio

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Configuration

```bash
# Backend setup
cd backend
cp env.example .env
# Edit .env and add your BRIA_API_KEY

# Frontend setup
cd ../frontend
cp env.example .env.local
# Update NEXT_PUBLIC_API_URL if needed (default: http://localhost:3002)
```

### Run Development Servers

```bash
# Terminal 1 - Backend (Port 3002)
cd backend
npm run dev

# Terminal 2 - Frontend (Port 3000)
cd frontend
npm run dev
```

🎉 **Open [http://localhost:3000](http://localhost:3000)** and start creating!

---

## 📸 Screenshots

### Style Extractor
![Style Extractor Interface](docs/images/style-extractor.png)
*Upload reference images and extract their visual DNA*

### Image Generator
![Image Generator Interface](docs/images/image-generator.png)
*Generate new images with your extracted style profiles*

### Style DNA Visualization
![Style DNA Parser](docs/images/style-dna.png)
*See exactly what attributes are captured and applied*

---

## 🎯 Roadmap

### ✅ Completed
- [x] Style DNA extraction from reference images
- [x] Multi-image profile generation
- [x] Seed-based variation control
- [x] Auto-generated profile naming
- [x] Text-only style transfer (no scene conflicts)

### 🚧 In Progress
- [ ] Batch processing for multiple generations
- [ ] Style profile import/export (JSON)
- [ ] Cloud storage for style profiles

### 🔮 Coming Soon
- [ ] Style blending (combine multiple profiles)
- [ ] Fine-tuning controls per generation
- [ ] API access for programmatic generation
- [ ] Style marketplace (share/discover profiles)
- [ ] Video frame style consistency
- [ ] Team collaboration features

---

## 🤝 Contributing

We welcome contributions! Whether it's:
- 🐛 **Bug reports** - Help us improve stability
- 💡 **Feature ideas** - Shape the product roadmap
- 📝 **Documentation** - Make it easier for everyone
- 🎨 **UI/UX improvements** - Enhance the experience

---

## 📄 License

**MIT License** - See [LICENSE](LICENSE) for details

---

## 🌟 Powered By

- **[Bria API](https://docs.bria.ai/)** - AI image generation engine
- **[Next.js](https://nextjs.org/)** - React framework
- **[Tailwind CSS](https://tailwindcss.com/)** - CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library

---

## 💬 Support & Community

- 📧 **Email**: [support@bria.ai](mailto:support@bria.ai)
- 📖 **Documentation**: [docs.bria.ai](https://docs.bria.ai/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/tchauvel/bria-fibo-studio/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/tchauvel/bria-fibo-studio/discussions)

---

<div align="center">

### 🎨 Built with ❤️ for photographers, artists, and creative professionals

**[Get Started](https://github.com/tchauvel/bria-fibo-studio)** • **[View Demo](#)** • **[Documentation](https://docs.bria.ai/)**

⭐️ **Star us on GitHub** — it helps the project grow!

</div>
