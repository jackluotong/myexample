const path = require('path');
const HtmlWebpackPlugin=require('html-webpack-plugin');
module.exports={
    mode:'development',
    entry:{
        name:'./main.js',
    },
    output:{
        path:path.resolve(__dirname, 'dist'),
        filename:'[name].[hash:6].js',
        clean:true,
    },
    plugins:[
        new HtmlWebpackPlugin({
            title:'my example',
            template:'./public/index.html',
            filename:'index.html',
            inject: false,
        })
    ],
    devServer:{
        port:8081,
        hot:true,
        // setupMiddlewares:(devServer)=>{
        //     console.log('Staring Node.js server...');
        //     return[]
        // }
    }
}