import { Link } from "wouter";
import { motion } from "framer-motion";
const blogPosts = [
    {
        slug: "ai-virtual-try-on-revolution",
        title: "The AI Virtual Try-On Revolution: How Technology is Transforming Fashion E-commerce",
        excerpt: "Discover how artificial intelligence is reshaping the way we shop for clothes online, reducing returns by up to 40% and increasing conversion rates.",
        date: "December 5, 2025",
        category: "Technology",
        readTime: "8 min read",
        image: "/blog/ai-fashion.jpg",
        featured: true
    },
    {
        slug: "reduce-returns-virtual-fitting",
        title: "How Virtual Fitting Rooms Can Reduce Your E-commerce Returns by 80%",
        excerpt: "Returns are the silent profit killer in fashion e-commerce. Learn how virtual try-on technology can dramatically reduce return rates while improving customer satisfaction.",
        date: "December 1, 2025",
        category: "Business",
        readTime: "6 min read",
        image: "/blog/returns.jpg",
        featured: false
    },
    {
        slug: "implementing-try-on-shopify",
        title: "Step-by-Step Guide: Implementing Virtual Try-On on Your Shopify Store",
        excerpt: "A comprehensive tutorial on integrating FashionMirror's virtual try-on widget into your Shopify store in under 15 minutes.",
        date: "November 28, 2025",
        category: "Tutorial",
        readTime: "10 min read",
        image: "/blog/shopify-integration.jpg",
        featured: false
    },
    {
        slug: "future-fashion-retail-2025",
        title: "The Future of Fashion Retail: Trends to Watch in 2025",
        excerpt: "From AR/VR shopping experiences to AI-powered personalization, explore the technologies that will define fashion retail in the coming years.",
        date: "November 20, 2025",
        category: "Industry",
        readTime: "7 min read",
        image: "/blog/future-fashion.jpg",
        featured: false
    },
    {
        slug: "body-positive-ai-fashion",
        title: "Body Positivity in AI Fashion Tech: Building Inclusive Try-On Experiences",
        excerpt: "How we're designing AI systems that celebrate all body types and help shoppers feel confident regardless of their size or shape.",
        date: "November 15, 2025",
        category: "Culture",
        readTime: "5 min read",
        image: "/blog/body-positive.jpg",
        featured: false
    },
    {
        slug: "roi-virtual-try-on",
        title: "Measuring ROI: The Business Case for Virtual Try-On Technology",
        excerpt: "Real data from merchants using FashionMirror: increased conversions, reduced returns, and improved customer lifetime value.",
        date: "November 10, 2025",
        category: "Business",
        readTime: "9 min read",
        image: "/blog/roi-analysis.jpg",
        featured: false
    }
];
const categories = ["All", "Technology", "Business", "Tutorial", "Industry", "Culture"];
export default function BlogIndex() {
    const featuredPost = blogPosts.find(post => post.featured);
    const regularPosts = blogPosts.filter(post => !post.featured);
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
              <span className="text-gray-400">|</span>
              <span className="text-gray-600 font-medium">Blog</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/docs">
                <span className="text-gray-600 hover:text-gray-900 transition-colors">Docs</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
            FashionMirror Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Insights, tutorials, and industry news about AI-powered virtual try-on technology and the future of fashion e-commerce.
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category, idx) => (<button key={idx} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${idx === 0
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {category}
            </button>))}
        </div>

        {/* Featured Post */}
        {featuredPost && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-16">
            <Link href={`/blog/${featuredPost.slug}`}>
              <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
                  <div className="flex flex-col justify-center">
                    <span className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
                      <i className="fas fa-star"></i>
                      Featured Article
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-300 text-lg mb-6">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                      <span>{featuredPost.date}</span>
                      <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                      <span>{featuredPost.readTime}</span>
                      <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                      <span className="text-primary">{featuredPost.category}</span>
                    </div>
                  </div>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-700">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <i className="fas fa-image text-6xl"></i>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>)}

        {/* Post Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {regularPosts.map((post, idx) => (<motion.article key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 * (idx + 1) }}>
              <Link href={`/blog/${post.slug}`}>
                <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer h-full">
                  <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 group-hover:scale-105 transition-transform duration-500">
                      <i className="fas fa-image text-4xl"></i>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-gray-400 text-sm">
                      <span>{post.date}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.article>))}
        </div>

        {/* Newsletter */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="mt-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get the latest insights on AI fashion technology and e-commerce trends delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"/>
            <button type="submit" className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
              Subscribe
            </button>
          </form>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">&copy; 2025 FashionMirror. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/"><span className="text-gray-500 hover:text-gray-900 text-sm">Home</span></Link>
              <Link href="/docs"><span className="text-gray-500 hover:text-gray-900 text-sm">Docs</span></Link>
              <Link href="/technology"><span className="text-gray-500 hover:text-gray-900 text-sm">Technology</span></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>);
}
