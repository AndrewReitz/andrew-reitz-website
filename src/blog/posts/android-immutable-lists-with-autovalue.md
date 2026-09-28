---
title: "Android: Immutable Lists with AutoValue"
date: 2017-05-31T15:58:58.935Z
author: "Andrew Reitz"

---

[AutoValue](https://github.com/google/auto/tree/master/value) is a great tool for avoiding boilerplate and avoiding incorrect immutable value classes into your codebase. The README from the project says it best.
> Value classes are extremely common in Java projects. These are classes for which you want to treat any two instances with suitably equal field values as interchangeable. That’s right: we’re talking about those classes where you wind up implementing equals, hashCode and toString in a bloated, repetitive, formulaic yet error-prone fashion.> …​> AutoValue provides an easier way to create immutable value classes, with a lot less code and less room for error, while not restricting your freedom to code almost any aspect of your class exactly the way you want it.

Doesn’t this sound great! For those of us stuck using Java (many other JVM languages have better solutions) it really is a blessing. You can even include AutoValue into your libraries since all it does it generate code, removing any dependencies to the AutoValue libraries itself.

This is all fine and dandy, but there are still a few issues I’ve run into specifically around lists. Lists are for better or worse mutable in Java. See [use a property of a mutable type](https://github.com/google/auto/blob/master/value/userguide/howto.md#mutable_property) to see what AutoValue recommends for making Lists Immutable. If you don’t have `ImmutableList` available to you, and if you’re like me you will do anything you can to avoid adding Guava to your Android codebase to avoid going over the 65k method limit, the code snipped works just as well by replacing `ImmutableList.copyOf(mutableNames)` with `Collections.unmodifiableList(new ArrayList&lt;&gt;(mutableNames))` and just using the List interface. This is getting into the tedious zone, but still significantly better than writing value classes by hand.

Now, having value classes is great, but generally in the Android world we aren’t creating them, rather the data is coming from an api is passed off to a json parser that creates and populates the objects. All of the json parsers I know of use some weird stuff (don’t look at the source you can’t unsee these things) to be able to create objects outside of their constructors, and to set final values. The two I’m specifically thinking of are [Moshi](https://github.com/square/moshi/) and [Gson](https://github.com/google/gson). To use AutoValue with these two json parsing libraries you’ll need to use their corresponding AutoValue extension: [auto-value-moshi](https://github.com/rharter/auto-value-moshi), [auto-value-gson](https://github.com/rharter/auto-value-gson)

When these JSON parsers see the `List` interface used they can utilize any type of list they see fit, and from my research they always use `ArrayList`. So, even after we make a static factory method, ensuring the list is immutable, we still end up with a list that can be modified, since it was set in our object outside of the method we provided.

One way that I have used in the past to ensure the list is Immutable is to have a package private method managed by auto, then a public facing one that I implement that will wrap the list making it functionally immutable. It looks something like
``@AutoValue  
**public** **abstract** **class** **MyClass** {  
  **abstract** List&lt;String&gt; **autoValues**();  
  **public** **final** List&lt;String&gt; **values**() {  
    **return** Collections.unmodifiableList(autoValues());  
  }  
}``

It’s not pretty, and can be a real pain when you have lots of lists in a class, fortunately there is a better way that both reduces the boilerplate and tells other developers that the list they are being given is not modifiable. First, we need an `ImmutableList` class. I created the following class that is a list and delegates everything to a backing unmodifiable list. All methods that will throw an exception if used are marked with `@Deprecated`.
``/**  
 * Quick and simple immutable list for easy use with auto-value. Methods that you cannot use  
 * are marked deprecated and will throw an unsupported operation exception.  
 * Delegates all methods to {**@link** Collections#unmodifiableList(List)}  
 *  
 * **@param** &lt;E&gt; The type this collection contains.  
 */  
**public** **final** **class** **ImmutableList**&lt;**E**&gt; **implements** **List**&lt;**E**&gt;, **RandomAccess**, **Serializable** {````  /**  
   * Create a new ImmutableList out of the provided collection.  
   *  
   * **@param** collection The collection to create a ImmutableList from.  
   * **@param** &lt;E&gt; The type the collection contains.  
   * **@return** a new ImmutableList  
   * **@throws** NullPointerException if the provided collection is null.  
   */  
  **public** **static** &lt;E&gt; ImmutableList&lt;E&gt; **create**(Collection&lt;E&gt; collection) {  
    **return** **new** ImmutableList&lt;&gt;(collection);  
  }````  **private** **final** List&lt;E&gt; delegate;````  **private** **ImmutableList**(Collection&lt;E&gt; collection) {  
    **this**.delegate = Collections.unmodifiableList(**new** ArrayList&lt;&gt;(collection));  
  }````  @Override **public** **int** **size**() {  
    **return** delegate.size();  
  }````  @Override **public** **boolean** **isEmpty**() {  
    **return** delegate.isEmpty();  
  }````  @Override **public** **boolean** **contains**(Object o) {  
    **return** delegate.contains(o);  
  }````  @NonNull @Override **public** Iterator&lt;E&gt; **iterator**() {  
    **return** delegate.iterator();  
  }````  @NonNull @Override **public** Object[] toArray() {  
    **return** delegate.toArray();  
  }````  @NonNull @Override **public** &lt;T&gt; T[] toArray(@NonNull T[] a) {  
    **return** delegate.toArray(a);  
  }````  @Deprecated @Override **public** **boolean** **add**(E e) {  
    **return** delegate.add(e);  
  }````  @Override **public** **boolean** **remove**(Object o) {  
    **return** delegate.remove(o);  
  }````  @Override **public** **boolean** **containsAll**(@NonNull Collection&lt;?&gt; c) {  
    **return** delegate.containsAll(c);  
  }````  @Deprecated @Override **public** **boolean** **addAll**(@NonNull Collection&lt;? extends E&gt; c) {  
    **return** delegate.addAll(c);  
  }````  @Deprecated @Override **public** **boolean** **addAll**(**int** index, @NonNull Collection&lt;? extends E&gt; c) {  
    **return** delegate.addAll(index, c);  
  }````  @Deprecated @Override **public** **boolean** **removeAll**(@NonNull Collection&lt;?&gt; c) {  
    **return** delegate.removeAll(c);  
  }````  @Deprecated @Override **public** **boolean** **retainAll**(@NonNull Collection&lt;?&gt; c) {  
    **return** delegate.retainAll(c);  
  }````  @Deprecated @Override **public** **void** **clear**() {  
    delegate.clear();  
  }````  @Override **public** E **get**(**int** index) {  
    **return** delegate.get(index);  
  }````  @Deprecated @Override **public** E **set**(**int** index, E element) {  
    **return** delegate.set(index, element);  
  }````  @Deprecated @Override **public** **void** **add**(**int** index, E element) {  
    delegate.add(index, element);  
  }````  @Deprecated @Override **public** E **remove**(**int** index) {  
    **return** delegate.remove(index);  
  }````  @Override **public** **int** **indexOf**(Object o) {  
    **return** delegate.indexOf(o);  
  }````  @Override **public** **int** **lastIndexOf**(Object o) {  
    **return** delegate.lastIndexOf(o);  
  }````  @Override **public** ListIterator&lt;E&gt; **listIterator**() {  
    **return** delegate.listIterator();  
  }````  @NonNull @Override **public** ListIterator&lt;E&gt; **listIterator**(**int** index) {  
    **return** delegate.listIterator(index);  
  }````  @NonNull @Override **public** List&lt;E&gt; **subList**(**int** fromIndex, **int** toIndex) {  
    **return** delegate.subList(fromIndex, toIndex);  
  }````  @Override **public** String **toString**() {  
    **return** delegate.toString();  
  }````  @Override **public** **boolean** **equals**(Object o) {  
    **return** delegate.equals(o);  
  }````  @Override **public** **int** **hashCode**() {  
    **return** delegate.hashCode();  
  }  
}``

It’s long, but you can pretty quickly implement this thanks to Android Studio/ IntelliJ’s delegate generation.

Now our former class get’s changed to look like the following.
``@AutoValue  
**public** **abstract** **class** **MyClass** {  
  **public** **abstract** ImmutableList&lt;String&gt; **values**();  
}``

Everyone using this class now knows that the list is Immutable, and we don’t have to worry create all that other boilerplate code. There is just one final piece to the puzzle to make this work.

We need to implement an adapter so that the JSON parsing library knows what to do when it sees an `ImmutableList`.

Here are the adapters I made for both Gson and Moshi.

**Gson:**
``**import** com.google.gson.Gson;  
**import** com.google.gson.TypeAdapter;  
**import** com.google.gson.TypeAdapterFactory;  
**import** com.google.gson.internal.$Gson$Types;  
**import** com.google.gson.reflect.TypeToken;  
**import** com.google.gson.stream.JsonReader;  
**import** com.google.gson.stream.JsonToken;  
**import** com.google.gson.stream.JsonWriter;  
**import** com.hyvee.android.util.ImmutableList;````**import** java.io.IOException;  
**import** java.lang.reflect.Type;  
**import** java.util.ArrayList;  
**import** java.util.List;````**public** **final** **class** **ImmutableListTypeAdapter**&lt;**E**&gt; **extends** **TypeAdapter**&lt;**ImmutableList**&lt;**E**&gt;&gt; {  
    **public** **static** **final** TypeAdapterFactory FACTORY = **new** TypeAdapterFactory() {  
        @Override **public** &lt;T&gt; TypeAdapter&lt;T&gt; **create**(Gson gson, TypeToken&lt;T&gt; typeToken) {  
            Class&lt;? **super** T&gt; rawType = typeToken.getRawType();  
            **if** (rawType != ImmutableList.class) {  
                **return** **null**;  
            }````            Type type = typeToken.getType();  
            Type elementType = $Gson$Types.getCollectionElementType(type, rawType);  
            TypeAdapter&lt;?&gt; elementAdapter = gson.getAdapter(TypeToken.get(elementType));````            @SuppressWarnings({&#34;unchecked&#34;, &#34;rawtypes&#34;}) // create() doesn&#39;t define a type parameter  
            TypeAdapter&lt;T&gt; adapter = **new** ImmutableListTypeAdapter(elementAdapter);  
            **return** adapter;  
        }  
    };````    **private** **final** TypeAdapter&lt;E&gt; elementAdapter;````    **private** **ImmutableListTypeAdapter**(TypeAdapter&lt;E&gt; elementAdapter) {  
        **this**.elementAdapter = elementAdapter;  
    }````    @Override **public** **void** **write**(JsonWriter out, ImmutableList&lt;E&gt; value) **throws** IOException {  
        out.beginArray();  
        **for** (E element : value) {  
            String json = elementAdapter.toJson(element);  
            out.jsonValue(json);  
        }  
        out.endArray();  
    }````    @Override **public** ImmutableList&lt;E&gt; **read**(JsonReader in) **throws** IOException {  
        **if** (in.peek() == JsonToken.NULL) {  
            in.nextNull();  
            // we don&#39;t want null in our code instead return a empty list  
            **return** ImmutableList.emptyList();  
        }````        List&lt;E&gt; result = **new** ArrayList&lt;&gt;();  
        in.beginArray();  
        **while**(in.hasNext()) {  
            E instance = elementAdapter.read(in);  
            result.add(instance);  
        }  
        in.endArray();  
        **return** ImmutableList.create(result);  
    }  
}``

**Moshi:**
``**import** com.squareup.moshi.JsonAdapter;  
**import** com.squareup.moshi.JsonReader;  
**import** com.squareup.moshi.JsonWriter;  
**import** com.squareup.moshi.Types;  
**import** java.io.IOException;  
**import** java.lang.reflect.Type;  
**import** java.util.ArrayList;  
**import** java.util.List;````**public** **final** **class** **ImmutableListJsonAdapter**&lt;**T**&gt; **extends** **JsonAdapter**&lt;**ImmutableList**&lt;**T**&gt;&gt; {  
  **public** **static** **final** Factory FACTORY = (type, annotations, moshi) -&gt; {  
    Class&lt;?&gt; rawType = Types.getRawType(type);  
    **if** (!annotations.isEmpty()) **return** **null**;  
    **if** (rawType != ImmutableList.class) {  
      **return** **null**;  
    }````    Type elementType = Types.collectionElementType(type, List.class);  
    JsonAdapter&lt;?&gt; elementAdapter = moshi.adapter(elementType);  
    **return** **new** ImmutableListJsonAdapter&lt;&gt;(elementAdapter);  
  };````  **private** **final** JsonAdapter&lt;T&gt; elementAdapter;````  **private** **ImmutableListJsonAdapter**(JsonAdapter&lt;T&gt; elementAdapter) {  
    **this**.elementAdapter = elementAdapter;  
  }````  @Override **public** ImmutableList&lt;T&gt; **fromJson**(JsonReader reader)  
      **throws** IOException {  
    List&lt;T&gt; result = **new** ArrayList&lt;&gt;();  
    reader.beginArray();  
    **while** (reader.hasNext()) {  
      result.add(elementAdapter.fromJson(reader));  
    }  
    reader.endArray();  
    **return** ImmutableList.create(result);  
  }````  @Override **public** **void** **toJson**(JsonWriter writer, ImmutableList&lt;T&gt; value) **throws** IOException {  
    writer.beginArray();  
    **for** (T element : value) {  
      elementAdapter.toJson(writer, element);  
    }  
    writer.endArray();  
  }  
}``

Once the adapter and it’s factory have been added to your project, you simply need to register it, and now you have the ability to keep all your AutoValue classes immutable.

For the full source code and tests see this [gist](https://gist.github.com/AndrewReitz/48fbff8ef47be3f79424a6cf6bb8f0aa).
