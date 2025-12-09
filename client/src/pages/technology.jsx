import { Link } from "wouter";
import { motion } from "framer-motion";
const techFeatures = [
    {
        icon: "fa-brain",
        title: "Advanced Neural Networks",
        description: "Our proprietary deep learning models are trained on millions of fashion images to understand garment structure, fabric drape, and body mechanics."
    },
    {
        icon: "fa-user-circle",
        title: "Body Pose Estimation",
        description: "Real-time 3D body pose detection ensures accurate garment placement regardless of the user's position or camera angle."
    },
    {
        icon: "fa-tshirt",
        title: "Garment Understanding",
        description: "AI automatically segments and classifies clothing items, understanding category, fit type, and how they should conform to different body shapes."
    },
    {
        icon: "fa-palette",
        title: "Texture Preservation",
        description: "Advanced texture mapping preserves fabric patterns, prints, and material qualities for photorealistic results."
    },
    {
        icon: "fa-bolt",
        title: "Real-time Processing",
        description: "Optimized inference pipelines deliver results in under 3 seconds, enabling seamless shopping experiences."
    },
    {
        icon: "fa-lock",
        title: "Privacy-First Design",
        description: "User photos are processed in secure, isolated environments and automatically deleted. We never store or train on user images."
    }
];
const stats = [
    { value: "98%", label: "Accuracy Rate" },
    { value: "<3s", label: "Processing Time" },
    { value: "40%", label: "Return Reduction" },
    { value: "2.5x", label: "Conversion Lift" }
];
export default function TechnologyPage() {
    return (<div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/">
                <span className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500" style={{ fontFamily: '"Playfair Display", serif' }}>
                  FashionMirror
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/docs">
                <span className="text-gray-600 hover:text-gray-900 transition-colors">Docs</span>
              </Link>
              <Link href="/blog">
                <span className="text-gray-600 hover:text-gray-900 transition-colors">Blog</span>
              </Link>
              <Link href="/merchant/login">
                <span className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Get Started
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
            <span className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-6 px-4 py-2 bg-primary/10 rounded-full">
              <i className="fas fa-microchip"></i>
              Powered by Advanced AI
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" style={{ fontFamily: '"Playfair Display", serif' }}>
              The Technology Behind
              <span className="block text-primary mt-2">FashionMirror</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              Our cutting-edge AI technology combines computer vision, deep learning, and generative models
              to create the most realistic virtual try-on experience in the industry.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, idx) => (<motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </motion.div>))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How Our AI Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A multi-stage pipeline that transforms photos into realistic try-on experiences
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {[
            {
                step: "01",
                title: "Image Analysis",
                desc: "Our AI analyzes the user photo to detect body pose, shape, and dimensions using advanced pose estimation.",
                icon: "fa-search"
            },
            {
                step: "02",
                title: "Garment Processing",
                desc: "The product image is segmented and analyzed to understand garment structure, fabric, and how it should drape.",
                icon: "fa-layer-group"
            },
            {
                step: "03",
                title: "Virtual Fitting",
                desc: "Our generative AI model synthesizes the garment onto the user, accounting for body shape and lighting.",
                icon: "fa-magic"
            },
            {
                step: "04",
                title: "Refinement",
                desc: "Final processing ensures photorealistic results with proper shadows, wrinkles, and fabric behavior.",
                icon: "fa-sparkles"
            }
        ].map((item, idx) => (<motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="relative">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <i className={`fas ${item.icon} text-primary text-xl`}></i>
                    </div>
                    <span className="text-4xl font-bold text-gray-200">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
                {idx < 3 && (<div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-gray-300">
                    <i className="fas fa-arrow-right"></i>
                  </div>)}
              </motion.div>))}
          </div>
        </div>
      </section>

      {/* Tech Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Key Technologies</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built on the latest advances in computer vision and generative AI
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {techFeatures.map((feature, idx) => (<motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -4 }} className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mb-6">
                  <i className={`fas ${feature.icon} text-white text-xl`}></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>))}
          </div>
        </div>
      </section>

      {/* AI Models Section */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl font-bold mb-6">
                Powered by Google Gemini &
                <span className="text-primary"> OpenAI</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                FashionMirror leverages the world's most advanced AI models to deliver unparalleled virtual try-on quality.
                Our hybrid approach combines multiple AI systems for optimal results.
              </p>

              <div className="space-y-6">
                {[
            {
                title: "Google Gemini Vision",
                desc: "Multimodal image understanding and generation for realistic garment synthesis"
            },
            {
                title: "OpenAI GPT-4",
                desc: "Intelligent instruction generation for optimal try-on positioning and styling"
            },
            {
                title: "Custom Fashion Models",
                desc: "Proprietary models fine-tuned on fashion data for industry-specific accuracy"
            }
        ].map((item, idx) => (<div key={idx} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <i className="fas fa-check text-primary text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                      <p className="text-gray-400">{item.desc}</p>
                    </div>
                  </div>))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                      <i className="fab fa-google text-4xl text-blue-400 mb-2"></i>
                      <div className="text-sm text-gray-400">Gemini</div>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                      <i className="fas fa-robot text-4xl text-green-400 mb-2"></i>
                      <div className="text-sm text-gray-400">OpenAI</div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">
                    Multi-model AI pipeline
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-shield-alt text-green-600 text-2xl"></i>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Privacy by Design</h2>
            <p className="text-xl text-gray-600 mb-8">
              We take user privacy seriously. Our technology is designed from the ground up to protect user data.
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              {[
            {
                icon: "fa-user-shield",
                title: "No Data Storage",
                desc: "User photos are processed in real-time and immediately deleted"
            },
            {
                icon: "fa-lock",
                title: "Encrypted Processing",
                desc: "All data is encrypted in transit and at rest"
            },
            {
                icon: "fa-database",
                title: "No Training",
                desc: "We never use user images to train our AI models"
            }
        ].map((item, idx) => (<div key={idx} className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                    <i className={`fas ${item.icon} text-green-600`}></i>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Experience the Future?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Integrate FashionMirror's AI-powered virtual try-on into your store today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs">
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-black rounded-lg font-medium hover:opacity-90 transition-opacity">
                  Read the Docs
                  <i className="fas fa-arrow-right"></i>
                </span>
              </Link>
              <Link href="/merchant/register">
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/20">
                  Get Started Free
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">&copy; 2025 FashionMirror. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/"><span className="text-gray-500 hover:text-gray-900 text-sm">Home</span></Link>
              <Link href="/docs"><span className="text-gray-500 hover:text-gray-900 text-sm">Docs</span></Link>
              <Link href="/blog"><span className="text-gray-500 hover:text-gray-900 text-sm">Blog</span></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>);
}
