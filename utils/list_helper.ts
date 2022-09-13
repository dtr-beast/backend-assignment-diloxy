import {BlogsParam} from "../models/blog"

function totalLikes(blogs: BlogsParam[]): number {
    return blogs.reduce((sum, item) => sum + item.likes, 0)
}

function favouriteBlogs(blogs: BlogsParam[]) {
    return blogs.reduce((prevBlog, currBlog) => {
        if (currBlog.likes > prevBlog.likes) {
            prevBlog = currBlog
        }
        return prevBlog
    }, blogs[0])
}

module.exports = {totalLikes, favouriteBlogs}
