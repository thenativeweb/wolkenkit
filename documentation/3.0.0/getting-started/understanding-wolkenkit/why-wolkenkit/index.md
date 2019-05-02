# Why wolkenkit?

Software development is not an end in itself. Instead, software gets written to solve actual real-world problems. Unfortunately, this fails regularly for various reasons. That's why we have built wolkenkit, a semantic JavaScript backend that addresses three important aspects of software development, and that empowers you to build better software faster.

## Empowering interdisciplinary teams

While trying to build software that solves real-world problems, more often than not issues arise. Important questions on the underlying business problems can't be answered, as the technical experts are missing the required domain knowledge. Since talking to the domain experts can feel intimidating, it becomes hard to answer these questions. Nevertheless this is the only viable way to grasp and understand the details of the domain.

Unfortunately, talking to people from other domains is rarely encouraged in education, and you are used to building teams and even organisations as clusters of similarly qualified people. As a result birds of a feather flock together.

We believe that having interdisciplinary teams with open discussions dramatically improves software development. But even within an interdisciplinary team one of the hardest things is finding consensus on what the actual underlying problem is that needs to be solved. What is the core domain? Which problem is the user going to solve, and how shall they do that?

It is incredibly hard to find answers to these questions. As developers we are so used to thinking in terms of CRUD, that *create*, *update*, and *delete* are the only verbs we know to map reality to. Yet the truth is that every non-trivial real-world problem is way more complex than those three words, and requires more expressive powers.

::: hint-wisdom
> **Domain-driven design**
>
> wolkenkit uses your domain language as code. This way it invites you to work in an interdisciplinary team as early as possible.
:::

With wolkenkit software development is different, as it builds on the principles of domain-driven design. Before writing any code, model, discuss, and shape your core domain on a whiteboard, together with the people that know it inside out. Then transform the result into JavaScript code, and run it with wolkenkit. We have carefully designed and developed wolkenkit to make this transformation as frictionless as possible.

## Learning from your past

For several decades developers have been getting used to store the current application state. Once you update it, any previous information gets lost. This leads to a number of questions that can't be answered easily. What was the previous state? What was the intention of updating? How did state evolve over time?

There are several workarounds for this problem, including history tables and audit logs. However, these solutions do not address the root cause of the problem, as they follow a data-driven approach, not a domain-driven one. They do not capture the users' intentions, only their results. Compare this to memorizing a fact, but immediately forgetting the events and experiences that have brought you there.

::: hint-wisdom
> **Event-sourcing**
>
> wolkenkit does not store the current application state, but the stream of events that led to it. This allows you to reinterpret your past.
:::

wolkenkit uses a different approach, as it builds upon the principles of event-sourcing. It uses an event store to record all of the events that happen within your application. The current state is the result of this event stream. Additionally, you can replay this stream to reinterpret events and learn from your past. We have carefully designed and developed wolkenkit to make this as simple and performant as possible.

## Scaling with confidence

The cloud's biggest benefit is its ability to scale elastically, according to your needs. Unfortunately, your application does not automatically benefit from this. Instead, your application's architecture needs to support this. This is hard to get right when building a CRUD monolith.

The biggest issue is the missing ability to optimize a CRUD application for reading and writing individually at the same time. You have to favor one side and either use a normalized or a denormalized model. The normalized model is great for consistent writes because there is no duplicated data. On the other hand it is hard to read since you need to rejoin the data. The denormalized model can be read efficiently, but it is hard to keep things consistent.

::: hint-wisdom
> **CQRS**
>
> wolkenkit separates reading data from writing them. This way you can optimize and scale them as needed.
:::

With wolkenkit scalability is different, as it builds upon the principles of CQRS. It separates reading data from writing them, so you can use an optimized model for either side. This way you can combine consistent writes with efficient reads. Since wolkenkit is a distributed application, it even runs dedicated processes for reading and writing. Anyway, this separation requires some synchronization. We have carefully designed and developed wolkenkit so that you do not have to care about this synchronization, and instead are able to focus on your domain.
