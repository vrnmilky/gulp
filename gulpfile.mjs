import { src, dest, watch, lastRun, series, parallel } from 'gulp';
import fileinclude from 'gulp-file-include';
import { deleteAsync as del } from 'del';
import imagemin from 'gulp-imagemin';
import changed from 'gulp-changed';
// 
import debug from 'gulp-debug';
//sass
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
//css
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import sortMediaQueries from 'postcss-sort-media-queries';
import maps from 'gulp-sourcemaps';
//
import serv from 'gulp-server-livereload';
// 
import webpack from 'webpack-stream';
import webpackConfig from './webpack.config.mjs';
import babel from 'gulp-babel';
// 
import { globSync } from 'glob';
import path from 'path';
import fs from 'fs';
// 
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';



const paths = {
    html: {
        src: './src/html/**/*.html',
        blocks: '!./src/html/blocks/*.html',
        dev: './build/',
        docs: './docs/',
    },
    styles: {
        src: './src/scss/**/*.scss',
        blocks: './src/scss/blocks/*.scss',
        dev: './build/styles/',
        docs: './docs/styles/',
    },
    scripts: {
        src: './src/js/**/*.js',
        dev: './build/js/',
        docs: './docs/js/',
    },
    images: {
        src: './src/img/**/*.{jpg,jpeg,png}',
        dev: './build/img/',
        docs: './docs/img/',
    },
    fonts: {
        src: './src/fonts/**/*',
        dev: './build/fonts/',
        docs: './docs/fonts/',
    },
    files: {
        src: './src/files/**/*',
        dev: './build/files/',
        docs: './docs/files/',
    },
    build: {
        dev: './build/',
        docs: './docs/'
    },

};

// 

const plumberNotify = (title) => {
    return {
        errorHandler: notify.onError({
            title: title + ' Error',
            message: 'Error: <%= error.message %>',
            icon: './icon.png',
            sound: false,
        }),
    };
};


const styleDevConf = [
    sortMediaQueries(),
];

const styleProdConf = [
    autoprefixer(),
    sortMediaQueries(),
    cssnano()
];


const stylesDev = () => styles(styleDevConf, paths.styles.dev);
const stylesProd = () => styles(styleProdConf, paths.styles.docs);

const scriptsDev = () => scripts(paths.scripts.dev);
const scriptsProd = () => scripts(paths.scripts.docs);

const htmlDev = () => html(paths.html.dev);
const htmlProd = () => html(paths.html.docs);

const imgDev = () => images(paths.images.dev);
const imgProd = () => images(paths.images.docs);

const fontsDev = () => fonts(paths.fonts.dev);
const fontsProd = () => fonts(paths.fonts.docs);

const filesDev = () => files(paths.files.dev);
const filesProd = () => files(paths.files.docs);

const serverDev = () => server(paths.build.dev);
const serverProd = () => server(paths.build.docs);



const cleanDev = () => del(paths.build.dev);
const cleanProd = () => del(paths.build.docs);



function html(mode) {
    const fileIncludeSetting = {
        prefix: '@@',
        basepath: '@file'
    };
    return src([paths.html.src, paths.html.blocks])
        .pipe(plumber(plumberNotify('HTML')))
        .pipe(fileinclude(fileIncludeSetting))
        .pipe(dest(mode))
}


function styles(plugins, mode) {
    return src(paths.styles.src)
        .pipe(plumber(plumberNotify('SCSS')))
        .pipe(maps.init())
        .pipe(sass())
        .pipe(postcss(plugins))
        .pipe(maps.write())
        .pipe(dest(mode));
}


function scripts(mode) {
    return src(paths.scripts.src)
        .pipe(plumber(plumberNotify('JS')))
        // .pipe(babel())
        .pipe(webpack(webpackConfig))
        .pipe(dest(mode));
}


function images(mode) {
    return src(paths.images.src, { encoding: false })
        .pipe(changed(mode))
        .pipe(debug({ title: 'Processing file:', showFiles: true }))
        .pipe(imagemin())
        .pipe(dest(mode));
}
function fonts(mode) {
    return src(paths.fonts.src, { encoding: false })
        .pipe(changed(mode))
        .pipe(debug({ title: 'Processing file:', showFiles: true }))
        .pipe(dest(mode));
}
function files(mode) {
    return src(paths.files.src, { encoding: false })
        .pipe(changed(mode))
        .pipe(debug({ title: 'Processing file:', showFiles: true }))
        .pipe(dest(mode));
}


function globUse(done) {
    const files = globSync(paths.styles.blocks);

    const imports = files
        .map(file => {
            const fileName = path.basename(file, '.scss').replace(/^_/, '');
            const normalizedPath = path.relative('./src/scss', file)
                .replace(/\\/g, '/');
            return `@use './${normalizedPath}' as ${fileName};`;
        })
        .join('\n');

    fs.writeFileSync('./src/scss/_imports.scss', imports);
    done();
}




function server(mode) {
    const serverSetting = {
        livereload: true,
        open: true,
    };
    return src(mode, { allowEmpty: true })
        .pipe(serv(serverSetting));
}


function watchDev() {
    watch(paths.html.src, htmlDev);
    watch(paths.styles.blocks, { events: ['add', 'unlink'] }, globUse)
    watch(paths.styles.src, stylesDev);
    watch(paths.scripts.src, scriptsDev);
    watch(paths.images.src, imgDev);
    watch(paths.files.src, filesDev);
    watch(paths.fonts.src, fontsDev);
}

function watchProd() {
    watch(paths.html.src, htmlProd);
    watch(paths.styles.blocks, { events: ['add', 'unlink'] }, globUse)
    watch(paths.styles.src, stylesProd);
    watch(paths.scripts.src, scriptsProd);
    watch(paths.images.src, imgProd);
    watch(paths.files.src, filesProd);
    watch(paths.fonts.src, fontsProd);
}




const build = series(
    cleanDev,
    parallel(htmlDev, stylesDev, imgDev, fontsDev, filesDev, scriptsDev),
    parallel(serverDev, watchDev));
export default build;

export const prod = series(
    cleanProd,
    parallel(htmlProd, stylesProd, imgProd, fontsProd, filesProd, scriptsProd),
    parallel(serverProd, watchProd));

export const clean = parallel(
    cleanProd, cleanDev
)