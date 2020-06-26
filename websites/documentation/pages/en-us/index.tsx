import { DocumentationPage } from '../../layouts/DocumentationPage';
import { News } from '../../components/News';
import { NewsItem } from '../../components/NewsItem';
import React, { ReactElement } from 'react';

export default (): ReactElement => (
  <DocumentationPage>
    <News>
      <NewsItem
        title='Released wolkenkit 3.1.0 🦄'
        year='2019'
        month='1'
        day='19'
      >

        Today, we have released wolkenkit 3.1.0. The new version improves handling persistent
        data. For details see the [changelog](https://docs.wolkenkit.io/3.1.0/getting-started/updating-wolkenkit/changelog/).

      </NewsItem>

      <NewsItem
        title='Released wolkenkit 3.0.0 🦄'
        year='2018'
        month='12'
        day='3'
      >

        Today, we have released wolkenkit 3.0.0. The new version provides a rewritten file
        storage, and import/export commands. It now also runs on Node.js 10.13.0. For details
        see the [changelog](https://docs.wolkenkit.io/3.0.0/getting-started/updating-wolkenkit/changelog/).

      </NewsItem>

      <NewsItem
        title='Published talk on DDD, event-sourcing and CQRS at the International JavaScript Conference 2018 🦄'
        year='2018'
        month='10'
        day='18'
      >

        Today, Golo Roden was giving a talk on DDD, event-sourcing and CQRS at the International
        JavaScript Conference 2018. The recording of this talk has now been published. For
        details see the [videos](https://docs.wolkenkit.io/latest/media/online-resources/videos/) section.

      </NewsItem>

      <NewsItem
        title='Published Webmontag Kassel talk on DDD and wolkenkit 🎊'
        year='2018'
        month='10'
        day='17'
      >

        Ten days ago, Golo Roden was giving a talk on DDD and wolkenkit at the Webmontag
        Kassel. The recordings of this talk have now been published. For details see the
        [videos](https://docs.wolkenkit.io/latest/media/online-resources/videos/) section.

      </NewsItem>

      <NewsItem
        title='Published MNUG talk on DDD and wolkenkit 🎉'
        year='2018'
        month='6'
        day='25'
      >

        About two weeks ago, Golo Roden was giving a talk on DDD and wolkenkit at the
        Munich Node.js user group (MNUG). The recordings of this talk have now been published.
        For details see the [videos](https://docs.wolkenkit.io/latest/media/online-resources/videos/) section.

      </NewsItem>

      <NewsItem
        title='Released wolkenkit 2.0.0 🦄'
        year='2018'
        month='6'
        day='21'
      >

        Today, we have released wolkenkit 2.0.0. The new version supports async/await,
        and comes with better IE11 compatibility. For details see
        the [changelog](https://docs.wolkenkit.io/2.0.0/getting-started/updating-wolkenkit/changelog/).

      </NewsItem>

      <NewsItem
        title='Released wolkenkit 1.2.0 🦄'
        year='2017'
        month='11'
        day='27'
      >

        Today, we have released wolkenkit 1.2.0. The new version now supports Node.js 8.9.1,
        so you can use async and await in your code. For the details
        see the [changelog](https://docs.wolkenkit.io/1.2.0/getting-started/updating-wolkenkit/changelog/).

      </NewsItem>

      <NewsItem
        title='Released episode 3 of the tech:lounge video course on wolkenkit 🎊'
        year='2017'
        month='11'
        day='26'
      >

        Today, we have released the third episode of the tech:lounge video course on wolkenkit.
        To watch the video head over to [techlounge.io/wolkenkit](https://www.techlounge.io/wolkenkit).

      </NewsItem>

      <NewsItem
        title='Released episode 2 of the tech:lounge video course on wolkenkit 🎉'
        year='2017'
        month='10'
        day='27'
      >

        Today, we have released the second episode of the tech:lounge video course on wolkenkit.
        To watch the video head over to [techlounge.io/wolkenkit](https://www.techlounge.io/wolkenkit).

      </NewsItem>

      <NewsItem
        title='Released episode 1 of the tech:lounge video course on wolkenkit 😊'
        year='2017'
        month='10'
        day='23'
      >

        Today, we have released the first episode of the tech:lounge video course on wolkenkit.
        To watch the video head over to [techlounge.io/wolkenkit](https://www.techlounge.io/wolkenkit).

      </NewsItem>

      <NewsItem
        title='Released wolkenkit-nevercompletedgame 1.0.0 🦄'
        year='2017'
        month='10'
        day='18'
      >

        Today, we have released wolkenkit-nevercompletedgame 1.0.0 as another sample
        application for wolkenkit. The code is available in the GitHub
        repository [thenativeweb/wolkenkit-nevercompletedgame](https://github.com/thenativeweb/wolkenkit-nevercompletedgame).

      </NewsItem>

      <NewsItem
        title='Released wolkenkit-todomvc 1.0.0 🎊'
        year='2017'
        month='10'
        day='7'
      >

        Today, we have released wolkenkit-todomvc 1.0.0 as a sample application for
        wolkenkit. The code is available in the GitHub
        repository [thenativeweb/wolkenkit-todomvc](https://github.com/thenativeweb/wolkenkit-todomvc).

      </NewsItem>

      <NewsItem
        title='Released wolkenkit-console 0.2.0 🎉'
        year='2017'
        month='9'
        day='22'
      >

        Today, we have released wolkenkit-console 0.2.0. The new version now supports
        OpenID Connect to allow working as an authenticated user. Download
        it from [npm](https://www.npmjs.com/package/wolkenkit-console) or use
        it [online](https://console.wolkenkit.io/).

      </NewsItem>

      <NewsItem
        title='Released wolkenkit-console 0.1.2 😊'
        year='2017'
        month='9'
        day='4'
      >

        A few days ago, we have released wolkenkit-console 0.1.2. It allows you to
        test your application&pos;s backend interactively without the need to build a UI.
        You can download it from [npm](https://www.npmjs.com/package/wolkenkit-console) or
        use it [online](https://console.wolkenkit.io/).

      </NewsItem>

      <NewsItem
        title='Released wolkenkit 1.1.0 🦄'
        year='2017'
        month='8'
        day='28'
      >

        Today, we have released wolkenkit 1.1.0. You can now run wolkenkit on Windows.
        For the lovely details see the [changelog](https://docs.wolkenkit.io/1.1.0/getting-started/updating-wolkenkit/changelog/).

      </NewsItem>

      <NewsItem
        title='Improved Docker compatibility 🐳'
        year='2017'
        month='7'
        day='1'
      >

        Today, we have released version 1.0.2 of the wolkenkit CLI. It enables you to
        run wolkenkit on Docker 17.05 and above. To update the CLI to the latest version,
        see [Updating the CLI](https://docs.wolkenkit.io/1.0.1/getting-started/updating-wolkenkit/updating-the-cli/).

      </NewsItem>

      <NewsItem
        title='Released wolkenkit 1.0.1 🎊'
        year='2017'
        month='6'
        day='21'
      >

        Today, we have released wolkenkit 1.0.1. It contains a fix for an error that
        occured while initializing new wolkenkit applications.

      </NewsItem>

      <NewsItem
        title='Hello wolkenkit 🎉'
        year='2017'
        month='6'
        day='20'
      >

        Finally, we have released wolkenkit, a semantic JavaScript backend. It empowers
        you to setup an API for your business to bridge the language gap between your
        domain and technology. [Want to get started?](https://docs.wolkenkit.io/1.0.0/getting-started/understanding-wolkenkit/why-wolkenkit/)

      </NewsItem>
    </News>
  </DocumentationPage>
);
