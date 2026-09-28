---
title: "Kotlin All the Things: An Experiment in Creating a Mobile App and Firebase Cloud Functions in Kotlin"
date: 2020-05-17T11:18:50-05:00
author: "Andrew Reitz"
featured_image: "/images/kotlin-logo.png"
---
As the title states, over the last few weeks, I attempted to make my app, and the Firebase Cloud Functions my app consumes, share the same code using Kotlin. I already have an Android App that is written in Kotlin. It's pretty simple. It gets a list of mountain bike trail conditions from an API and displays that data in a list. You can favorite some of the trails so they will be placed in a favorites list, and you can subscribe to a trail to get updates about that trail via push notifications.

Push notifications are triggered by two Firebase Cloud Functions. One calls the same API as the app then uses the response to store data in Firestore. Then another cloud function picks up any changes that occur in Firestore and sends notifications out to the app. 

I thought that this would be a great opportunity to try out Kotlin Multiplatform. I want to be able to share the networking layer between the Android app and the Firebase functions, rather than write it once in Kotlin and once in JavaScript. To start simple I took my single Gradle module Android project and split it into three separate modules. One for the multi-platform networking code, one for the JavaScript Firebase code, and the Android app. The networking code would use coroutines, ktor, and Kotlin serialization, all multiplatform libraries. Creating the multiplatform project took some time just because I was new to it but the docs on the Kotlin website are pretty easy to follow. Once set up writing the code and tests was pretty straight forward. 

The Gradle file ends up looking like this:
```
plugins {
    kotlin("multiplatform")
    kotlin("plugin.serialization")
}

kotlin {
    jvm()
    js { nodejs() }
    
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(kotlin("stdlib-common"))
                api("io.ktor:ktor-client-core:${versions.ktor}")
                api("io.ktor:ktor-client-json:${versions.ktor}")
                api("io.ktor:ktor-client-serialization:${versions.ktor}")
                api("org.jetbrains.kotlinx:kotlinx-serialization-runtime-common:${versions.serialization}")
            }
        }
        val commonTest by getting {
            dependencies {
                implementation(kotlin("test-common"))
                implementation(kotlin("test-annotations-common"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.3.5")
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.3.5")
                implementation("io.ktor:ktor-client-mock:${versions.ktor}")
            }
        }
        val jvmMain by getting {
            dependencies {
                implementation(kotlin("stdlib"))
                api("io.ktor:ktor-client-okhttp:${versions.ktor}")
                api("io.ktor:ktor-client-json-jvm:${versions.ktor}")
                api("io.ktor:ktor-client-serialization-jvm:${versions.ktor}")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-runtime:${versions.serialization}")
            }
        }
        val jvmTest by getting {
            dependencies {
                implementation(kotlin("test-junit"))
                implementation("io.ktor:ktor-client-mock-jvm:${versions.ktor}")
            }
        }
        val jsMain by getting {
            dependencies {
                implementation(kotlin("stdlib-js"))
                api("io.ktor:ktor-client-js:${versions.ktor}")
                api("io.ktor:ktor-client-serialization-js:${versions.ktor}")
                implementation(npm("abort-controller", "3.0.0")) // required by ktor but not pulled in
                implementation(npm("node-fetch", "2.6.0")) // required by ktor but not pulled in
                implementation(npm("text-encoding", "0.7.0")) // required by ktor but not pulled in
                api("org.jetbrains.kotlinx:kotlinx-serialization-runtime-js:${versions.serialization}")
            }
        }

        val jsTest by getting {
            dependencies {
                implementation(kotlin("test-js"))
                implementation("io.ktor:ktor-client-mock-js:${versions.ktor}")
            }
        }
    }
}
```

The Repository:
```
class MorcTrailRepository(
    client: HttpClient,
    private val url: String = "https://api.morcmtb.org/v1/trails"
) {
    private val client = client.config {
        install(JsonFeature) {
            serializer = KotlinxSerializer()
        }
    }

    suspend fun getTrails(): Result<List<MorcTrail>, Exception> = resultFrom {
        retry {
            client.get<List<MorcTrail>>(url)
        }
    }
}
```

The Android app was already developed but was using the Square Libraries, Retrofit, and OkHttp. Swapping these out wouldn't be too difficult to do, so we won't spend time on that here.

On to the Firebase code. To just test that this will all work, I attempted to make a proxy for the API. Setting up the main function to call the networking layer is easy and works fine. Let's look at some code here. 

```
fun main() {
    when(val result = repository.getTrails()) {
        is Success -> {
            println("yay! trails=${result.data}")
        }
        is Failure -> {
            console.log("Error getting data from backend ${result.reason}")
        }
    }
}
```

To test this, I just run `gradlew nodeRun`, and it works great. So far so good. Unfortunately, here's where things start to go wrong. All I need to do to have my code work on Firebase is to remove the main function, and instead have the function be exported as seen in the Firebase documentation. [https://firebase.google.com/docs/functions/http-events](https://firebase.google.com/docs/functions/http-events) To achieve this, I tried a lot of different things. I figured `val functionName = functions.https.onRequest...` would do the trick since this is similar to when I got Kotlin JS to run on Google Cloud Functions, but no matter what I did I couldn't get Firebase to pick it up. 

The `functions.https.onRequest` is just using the Firebase package from npm and pulled in using `@JsModule`. You can find more info on how to do this here [https://kotlinlang.org/docs/tutorials/javascript/using-packages-from-npm.html](https://kotlinlang.org/docs/tutorials/javascript/using-packages-from-npm.html).

After digging around on the internet a lot I came across [this blog post](https://medium.com/@LuhmirinS/setting-up-firebase-functions-with-kotlin-1c34b2ca2427) in which he uses `exports` in his main function by making it just an exported function. Another solution I found is creating a js file, importing my script, and then setting up the exports there pointing to my function something as simple as this: 

```
const trails = require("morc-trails");
export.trails = trails.trails;
```

To test Firebase functions you can't just run the nodeRun Gradle command, you need to use the Firebase Emulator to run it instead. I created a simple Gradle task that would build my code and then run it with the emulator. It looks something like this. 

```
tasks.register<Exec>("firebaseTest") {
 dependsOn(tasks.named("build"))
 // outputs are placed in root directory's build folder and then named after your module
 workingDir(rootProject.file("firebase-cloud-functions"))
 commandLine("firebase", "emulators:start", "--only", "functions")
}
```

Alright, everything is working great locally. Only a few days spent on something that I could have whipped up in javascript in a few hours. Now to deploy it, this is where things get tricky. 

Firebase requires you to upload your javascript file(s) and a `package.json` that tells firebase where all your dependencies live. The Kotlin task that "compiles" everything uses yarn to manage packages, and yarn supports a few extra options in `package.json` files than npm doesn't support. On top of that, many packages like ktor are not published to npm but instead live in jar files on Maven Central. They appear to be unpacked locally and then tied together using yarn. Lastly, I have a module that isn't published to either of these where the shared networking code lives. This code appears to also live in the build folder and is wired together with the rest of the project using yarn.
The root build directory will look something like this [![Screen-Shot-2020-05-13-at-3-17-40-PM.png](https://i.postimg.cc/3WQ59XXn/Screen-Shot-2020-05-13-at-3-17-40-PM.png)](https://postimg.cc/SYdvxztM)
The `node_modules` are downloaded packages or symlinks to local packages. Packages are your Gradle modules/projects. I have two here, the firebase project and the shared networking code. Lastly the `packages_imported` are the dependencies from Maven Central unpacked.

Asking around in some different Slacks, I got the suggestion to try targeting the browser instead of node. I changed my output target from node to browser since browser output bundles everything together into a single script. This sounds like exactly what I want because there doesn't seem to be an easy way to package this up. 

On to the next issue, which occurs because I'm attempting to run a browser targeted code on node rather than in the browser. Webpack, the underlying tool that packages and optimizes the scripts fails, saying it doesn't know about the `fs` package. After lots of Googling, and trial and error, I was able to find that you can make a folder called `webpack.config.d` in your modules directory and add a js file (yes you can name it anything) where you can add extra configuration options for webpack. I had to add `config.target = "node";`.

Now everything bundles up nicely, but I am getting an issue when running the code. Because webpack optimizes and minifies code, as well as the compile task from Kotlin does dead code elimination it makes it really hard to tell where it’s coming from. After more research I find that I can add this to my `build.gradle.kts` file to turn off dead code elimination.
```
kotlin {  
  target {  
    browser {  
      dceTask {  
        dceOptions.devMode = true  
      }
    }  
  }
}
```
Add this to the JS file I have in `webpack.config.d` to turn off minification and optimizations.
```
config.optimization = {
 minimize: false,
 usedExports: false
};
config.mode = "development";
```

Hopefully, now I can see what the issue is! And I do, you can see it in action [here](https://github.com/AndrewReitz/ktor-abort-controller-issue). This [line of code](https://github.com/ktorio/ktor/blob/f1b970e6f925a8dbf3f1bea49a4928bf76f22292/ktor-client/ktor-client-core/js/src/io/ktor/client/engine/js/compatibility/Utils.kt#L46) works when node.js is targeted, but not the browser. I have a hunch that somehow webpack includes the wrong distribution file of [`abort-controller`](https://github.com/mysticatea/abort-controller), but after asking around on a few different Slacks and the webpack gitter, I decided to give up on trying to figure out how to configure this.

Now, I can leave ktor out, and use `node-fetch` but the whole point of this exercise is to do everything in Kotlin and share the code between the two clients. I can implement a JS version and a JVM version in the library but the code would be duplicated and just share essentially a common interface. Not what I want. 

Another option? While researching all these things, I find that you can include [local modules](https://firebase.google.com/docs/functions/handle-dependencies#including_local_nodejs_modules_as_part_of_your_deployment_package) that should be included with the deploy in the Firebase docs. To test this out I copy over the contents of the `build/js` folder into the functions folder of the Firebase project then start updating the `package.json` file at the root of the functions folder to point to each package that isn't in the npm registry. I also update the main entry in the `package.json` to point to my script in the packages folder. 

This is very tedious but after running `npm install`, local testing with the firebase emulator works! However, when I go to deploy it, there are more errors about packages not being found. After more searching, I realize that the networking module has a `package.json` that refers to these packages as if they were in npm rather than their local paths. Updating this `package.json` in the `js/packages` folder, and then running the deploy command finally works! 

Setting this all up was very tedious, and, unfortunately, I can't figure out a good way to automate it. It can be done, but it's not a quick task. 

I started researching other cloud function options and noticed that all other options out there allow you to upload your `node_modules` folder, whether it be with a zip file or by changing your configuration. Reporting a feature request specifically for firebase seemed out of the question. So, I made the switch to Google Cloud Functions which, overall, seems to make things a lot easier. 

I created a Gradle plugin (just in my project, but I’m willing to open source it if there is interest) that allows me to configure what cloud functions to test and deploy. 

You can see the project I talked about in this blog post in it's [entirety, here]([https://gitlab.com/andrew.reitz/mn-trail-conditions-app](https://gitlab.com/andrew.reitz/mn-trail-conditions-app)).

## The takeaway

I spent so many hours over a few weeks getting to this point. So, if you're trying to just get something done writing it in JavaScript is still probably the best route. But, if you want to play with Kotlin multi-platform, or have some complex code you don't want to write in two different languages, this might be the path for you. If you do choose to go down this route, hopefully, my experience helps you out. If you have any questions please feel free to reach out on the Kotlin Slack!

Big thanks to the people who answered my questions on the KotlinLang Slack and the editors who helped with the spelling and grammar of this post.

