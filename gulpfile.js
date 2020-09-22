// const projectFolder = require('path').basename(__dirname)
const projectFolder = "dist"
const srcFolder = "src"
const fs = require('fs')

const path = {
  build: {
    html: `${projectFolder}/`,
    css: `${projectFolder}/css/`,
    js: `${projectFolder}/js/`,
    img: `${projectFolder}/img/`,
		fonts: `${projectFolder}/fonts/`,
		icons: `${projectFolder}/`
  },
  src: {
    html: [`${srcFolder}/*.html`, `!${srcFolder}/_*.html`],
    css: `${srcFolder}/scss/style.scss`,
    js: `${srcFolder}/js/script.js`,
    img: `${srcFolder}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
		fonts: `${srcFolder}/fonts/**/*.ttf`,
		icons: `${srcFolder}/iconsprite/*.svg`
  },
  watch: {
    html: `${srcFolder}/**/*.html`,
    css: `${srcFolder}/scss/**/*.scss`,
    js: `${srcFolder}/js/**/*.js`,
		img: `${srcFolder}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
		icons: `${srcFolder}/iconsprite/*.svg`
  },
  clean: `./${projectFolder}/`
}

const {
  src,
  dest
} = require('gulp')
const gulp = require('gulp')
const browserSync = require('browser-sync').create()
const fileInclude = require('gulp-file-include')
const del = require('del')
const scss = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const groupCssMedia = require('gulp-group-css-media-queries')
const cleanCss = require('gulp-clean-css')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify-es').default
const imagemin = require('gulp-imagemin')
const webp = require('gulp-webp')
const webpHtml = require('gulp-webp-html')
const webpcss = require("gulp-webpcss")
const svgSprite = require('gulp-svg-sprite')
const ttf2woff = require('gulp-ttf2woff')
const ttf2woff2 = require('gulp-ttf2woff2')
const fonter = require('gulp-fonter')

function brwsrSync(params) {
  browserSync.init({
    server: {
      baseDir: path.clean
    },
    port: 3000,
    notify: false
  })
}

function html() {
  return src(path.src.html)
    .pipe(fileInclude())
    .pipe(webpHtml())
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream())
}

function css() {
  return src(path.src.css)
    .pipe(scss({
      outputStyle: "expanded"
    }))
    .pipe(groupCssMedia())
    .pipe(autoprefixer({
      overrideBrowserslist: ["last 5 versions"],
      cascade: true
		}))
		.pipe(webpcss({
			webpClass: 'webp',
			noWebpClass: '.no-webp'
		}))
    .pipe(dest(path.build.css))
    .pipe(cleanCss())
    .pipe(rename({
      extname: ".min.css"
    }))
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream())
}

function js() {
  return src(path.src.js)
    .pipe(fileInclude())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(rename({
      extname: ".min.js"
    }))
    .pipe(dest(path.build.js))
    .pipe(browserSync.stream())
}

function images() {
  return src(path.src.img)
    .pipe(webp({
      quality: 70
    }))
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{
        removeViewBox: false
      }],
      interlaced: true,
      optimizationLevel: 3
    }))
    .pipe(dest(path.build.img))
    .pipe(browserSync.stream())
}

function fonts(params) {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}

gulp.task('otf2ttf', function () {
  return src([`${srcFolder}/fonts/*.otf`])
    .pipe(fonter({
      formats: ['ttf']
    }))
    .pipe(dest(`${srcFolder}/fonts/`))
})

function svgsprites() {
	return gulp.src([`${srcFolder}/iconsprite/*.svg`])
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: '../icons/icons.svg',
					example: true
				}
			}
		}))
		.pipe(dest(path.build.icons))
    .pipe(browserSync.stream())
}

function clean(params) {
  return del(path.clean)
}

function fontsStyle(params) {

  let file_content = fs.readFileSync(srcFolder + '/scss/fonts.scss');
  if (file_content == '') {
    fs.writeFile(srcFolder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (let i = 0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(srcFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
}

function cb() {}

function watcher(params) {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.img], images)
  gulp.watch([path.watch.icons], svgsprites)
}

const build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts, svgsprites), fontsStyle)
const watch = gulp.parallel(build, watcher, brwsrSync)

exports.svgsprites = svgsprites
exports.fontsStyle = fontsStyle
exports.fonts = fonts
exports.images = images
exports.js = js
exports.css = css
exports.html = html
exports.build = build
exports.watch = watch
exports.default = watch