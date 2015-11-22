"use strict";

const gulp = require("gulp");
const istanbul = require("gulp-istanbul");
const mocha = require("gulp-mocha");
const eslint = require("gulp-eslint");
const runSequence = require("run-sequence");
const shell = require("gulp-shell");

gulp.task("eslint", () => {
	return gulp.src(["src/*.js", "test/*.test.js"])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failOnError());
});

gulp.task("mocha", callback => {
	gulp.src(["src/*.js"])
		.pipe(istanbul())
		.on("error", callback)
		.pipe(istanbul.hookRequire())
		.on("finish", () => {
			gulp.src(["test/*.test.js"])
				.pipe(mocha())
				.on("error", callback)
				.pipe(istanbul.writeReports())
				.pipe(istanbul.enforceThresholds({
					thresholds: {
						global: 90
					}
				}))
				.on("end", callback);
		});
});

gulp.task("test", callback => {
	runSequence("mocha", "eslint", callback);
});

gulp.task("docs", callback => {
	gulp.src("src/index.js")
		.pipe(shell("./node_modules/.bin/jsdoc --configure .jsdoc.json"))
		.on("error", callback)
		.on("end", callback);
});

gulp.task("docWatch", () => {
	gulp.watch(["src/**", "test/**"], ["test", "docs"]);
});

gulp.task("watch", () => {
	gulp.watch(["src/**", "test/**"], ["test"]);
});

gulp.task("default", () => {
	runSequence("test", "watch");
});

gulp.task("withDocs", () => {
	runSequence("test", "docs", "docWatch");
});
