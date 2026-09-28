---
title: "MacBook Pro Thermal Throttling"
date: 2020-04-30T14:26:11-05:00
author: "Andrew Reitz"
---

It's getting hotter in MN, and with that my work MacBook Pro and other computers I keep in my office are starting to make it an uncomfortable temperature. To solve this issue I simply turned on a box fan and pointed it out of my office. 
[![IMG-20200420-125903.jpg](https://i.postimg.cc/QNmP8mqk/IMG-20200420-125903.jpg)](https://postimg.cc/xqkggKhc)
This just so happened to be right next to my work computer and although this was very subjective, I thought that my builds seemed to be running a bit faster. I mentioned this to some co-workers, one who linked a twitter post of someone doing something similar saying that pointing a fan at their MacBook Pro prevented their computer from being thermal throttled and included the command `pmset -g thermlog` to see the throttling logs. I'd include the tweet here, but I've since lost it. Anyone knows the tweet I'm talking about let me know and I'll include it here to give some credit where credit is due.

I thought to myself, I'm not going to check these logs constantly to watch for throttling, so instead, I decided to create a little app that notifies me when my CPU is being throttled. This hacked together app can be seen [here](https://github.com/AndrewReitz/macos-cpu-throttle-notifier). 

[![Screen-Shot-2020-04-30-at-1-10-49-PM.png](https://i.postimg.cc/wvcrsQYz/Screen-Shot-2020-04-30-at-1-10-49-PM.png)](https://postimg.cc/8Jc42WCX)

I have three settings on my fan and noticed that when I do have it set on the highest setting my computer takes a lot longer to be throttled, which is great but doesn't prevent it entirely. It also seems like the fans on a MacBook Pro only run after the CPU has been throttled. I don't know about you but I'd much rather see them run before my CPU is being throttled. If you ever feel like your not as powerful computer seems to run faster than you MBP this is probably one reason. I noticed that my computer was being throttled all the time! Which is really making me want to work on a desktop linux machine again.

I think to get more info on this topic I'd like to create an app that watches the logs and plots those against my started gradle builds, but I have a lot of other projects on my plate. I'll post if I end up doing this! Thanks for taking the time to read this post and hope you find it interesting and or helpful!
