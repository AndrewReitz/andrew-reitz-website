---
title: "Maximizing Moshi’s Potential"
date: 2018-09-20T22:03:06.193Z
author: "Andrew Reitz"

---

Moshi is an amazing tool. It’s much smaller and works a lot better for Kotlin deserialization than it’s predecessor GSON. If you’re not using it read more about it [here](https://github.com/square/moshi). In this post, I’m going to show you how to get the best app performance while maximizing your build speed when using Moshi.

Moshi for Kotlin uses the kotlin-reflect library which can add to the size of your app, not to mention that it’s reflection, which isn’t the most performant and has serious issues with Proguard. Fortunately, Moshi also offers code generation through the use of an annotation processor. This is great, but annotation processors can hurt build speeds. Since Moshi has both options why can’t we get the best of both worlds?

So first things first, we add the dependencies we need. (NOTE: I’m using the Kotlin Gradle DSL but these should translate to Groovy pretty easily).
`_implementation_(&#34;com.squareup.moshi:moshi:1.6.0&#34;)  
_debugImplementation_(&#34;com.squareup.moshi:moshi-kotlin:1.6.0&#34;)  
_kaptRelease_(&#34;com.squareup.moshi:moshi-kotlin-codegen:1.6.0&#34;)`

This pulls in the plain old Moshi jar to all build types, on debug builds types includes the Kotlin specific library, which in turn includes the kotlin-reflect library. And finally, we include the annotation processor just for the release builds.

Now we need to add a flag so that Moshi knows just how to handle the models you create. We can’t use `BuildConfig.DEBUG` due to it being set from `Boolean.parseBoolean(&#34;true&#34;);` which is not considered a compile-time constant. So I write my own by doing the following.
`buildTypes **{  
** _getByName_(&#34;debug&#34;) **{  
        ...  

** buildConfigField(&#34;boolean&#34;, &#34;MOSHI_GENERATOR_ENABLED&#34;, &#34;false&#34;)  
    **}  
** _getByName_(&#34;release&#34;) **{**``        ...  
        buildConfigField(&#34;boolean&#34;, &#34;MOSHI_GENERATOR_ENABLED&#34;, &#34;true&#34;)  
    **}  
}**`

After we create our constants, we need to tell the annotation processor when to and when not to run. Luckily Square has thought of this for us. The annotation `JsonClass` has a parameter of `generateAdapter`. You will need to annotate all your classes with this annotation and set `generateAdapter` to `MOSHI_GENERATOR_ENABLED`.

Example:
`@JsonClass(generateAdapter = BuildConfig._MOSHI_GENERATOR_ENABLED_)  
data class TrailData(  
 val name: String,  
 val status: String,  
 @Json(name = “fullDescription”) val description: String,  
 val lastUpdated: LocalDateTime  
)`

Ok, and last but not least on your debug builds you will need to add `KotlinJsonAdapterFactory` to your Moshi instance. I set this up in my debug Dagger configuration, but you have lots of options. It’s as simple as
`val moshi = Moshi.Builder()  
    .add(KotlinJsonAdapterFactory())  
    .build()`

You can choose how to skip this in your release build, whether it’s using the BuildConfig or separate source sets, you decide.

There you have it your code will now use codegen for release builds and use reflection for debug builds.Update: This PR gets ride of the BuildConfig flag that is used with the `@JsonClass` [https://github.com/square/moshi/pull/728](https://github.com/square/moshi/pull/728)
