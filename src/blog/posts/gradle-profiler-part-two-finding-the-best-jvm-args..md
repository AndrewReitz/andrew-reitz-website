---
title: "The Gradle Profiler: Part Two, finding the best JVM args."
date: 2019-05-28T21:40:27.176Z
author: "Andrew Reitz"

---

![image](https://cdn-images-1.medium.com/max/800/1*tCw6MvZIDMgrugy95w7Zzw.jpeg)



### The Gradle Profiler: Part Two, finding the best JVM args.

In [part one](https://medium.com/andrews-tech-blog/the-gradle-profiler-part-1-introduction-bdcbe70efe08) I covered what the Gradle Profiler is and how to use it. This time I will be taking a closer look at how to make your build faster by finding the best JVM memory arguments.

As mentioned in the [_Build Bigger, Better: Gradle for Large Projects_](https://youtu.be/sQC9-Rj2yLI?t=1783) talk at Google I/O, JVM heap size is a value you can change to get drastically better performance out of your build. In the talk they said they used build scans to find the best option, following their lead lets see how we can use the Gradle Profiler to automate this task and get the best results for our development computer.

This article assumes you have already set up the [Gradle Profiler](https://github.com/gradle/gradle-profiler). If not refer back to [part one](https://medium.com/andrews-tech-blog/the-gradle-profiler-part-1-introduction-bdcbe70efe08). I will be using the [plaid](https://github.com/android/plaid) app to profile against again so you can follow along.

First things first, I will create a scenarios file that will repeat the same task but with different JVM arguments. For this scenario I have chosen to run the `assembleDebug` task because it’s the task I will be running time and time again as I work on an app, so it will be the task I want to optimize for. My development builds will most likely not be clean builds either but rather a change in a Gradle module. To mimic this I’ll use `apply-abi-change-to` which will change the file causing that module the file is in and any other dependent modules to be recompiled. With these parameters in mind I created the following scenario file¹.




This scenario file is large, and it will take a while to run. You can remove scenarios to save time, but you might end up skipping configurations that would be best for your environment. You’ll notice in the `default-scenarios` section I have the `abi-assemble-default` and only the even number heap size scenarios. This is to speed up how long it will take to run these benchmarks. When I get the results I can update the `default-scenarios` or pass arguments to the Gradle Profiler to better match what I found, speeding up the whole process.

Let’s get profiling! After executing `gradle-profiler --benchmark --project-dir . --scenario-file jvm-args-abi.scenarios` in the plaid directory, I get these results:




![image](https://cdn-images-1.medium.com/max/800/1*ZtHD-ckBfbzV_zPwHr7_tw.png)

Results



I cut off the top portion of the results to save some space, but you’ll notice the first column is the first scenario, `abi-assemble-default`. This is our performance baseline. As you can see the second column, the `abi-assebmle-2gb` scenario has a 7.69% faster mean build time then the default JVM arguments whereas every other argument was actually slower! That means 2 GB is probably just right. To be sure I will run `gradle-profiler --benchmark --project-dir --scenario-file jvm-args-abi.scenarios abi-assemble-default abi-assemble-1gb abi-assemble-2gb abi-assemble-3gb`, since we skipped 1GB and 3GB in the last run, resulting in the following output:




![image](https://cdn-images-1.medium.com/max/800/1*7GHrUty-tUAwE7J0LfT2Zw.png)

Results for 1gb, 2gb, and 3gb



You can see here that 3GB did the best and this will probably be the value I choose to set in my `gradle-user-home`. Just to be certain this value is what I want, I will run the 2gb and 3gb scenarios with the profiler using build scans, to double check the build length and see how much time each of these builds spend on garbage collection. `gradle-profiler --profile buildscan --project-dir . --scenario-file jvm-args-abi.scenarios abi-assemble-2gb abi-assemble-3gb` . You can see my results here: [2GB](https://scans.gradle.com/s/mtfosxreo652a/performance/build) and [3GB](https://scans.gradle.com/s/masz2zotabwgg/performance/build). These are already on the performance tab, which is where you will want to go for your build’s. Since plaid is a pretty small app there doesn’t appear to be much of a difference here and I will choose the 3GB option.

To set 3GB as my max heap size I will edit my `gradle.properties` file in my Gradle User Home (in `$HOME/.gradle/` by default). If the `gradle.properties` file doesn’t exist, simply create one with that name. I will add `org.gradle.jvmargs=-Xmx3G` on a single line in the file and save it. Now, when the Gradle Daemon starts up it will be able to use a max head size of 3GB. You can specify more [JVM arguments](https://docs.oracle.com/javase/7/docs/technotes/tools/solaris/java.html) on the right side of the equals, but it’s recommended to only adjust the memory arguments. For instance `-Xmx`, `-Xms` and **maybe** `-XX:MaxMetaspaceSize`, and make sure you profile these before you change them!

I cannot stress this enough, **do not copy my heap size value**. My machine is most likely different than yours. Also, you will want to make sure you’re not doing anything on your computer while these tests are running, as that will skew your results².

It’s probably worth benchmarking on your average development machine for your project and setting the values found as the defaults in your project’s `gradle.properties`. It’s also probably worth benchmarking and setting some different values for your CI server. Lastly, it is also worth adding a script that will run the profiler, so the other devs on your team can can find the best values for their machines.

Big thanks to [Brendon](https://twitter.com/brendonjustin_) and Kristi for proof reading the article![1] I know very little about the plaid project structure and just chose the `ImageUriProvider.kt` because it was in the core package and assumed all other modules depended on it. You will want to optimize your own build for whichever module you change the most. IE. if you work on a certain feature that has it’s own module in your app, you will probably want the `apply-abi-change-to` to point to something in that module.

[2] You probably noticed that 2GB didn’t do as well this time as last time, this is probably due to my computer falling asleep while I was running these tests. Why didn’t I re-run them? Mainly because you should not copy my results for you own machine, so it really doesn’t matter what I display here.
