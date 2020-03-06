import { DocumentationPage } from '../../layouts/DocumentationPage';
import Hint from '../../components/Hint';
import { Code, Headline, Paragraph } from 'thenativeweb-ux';
import React, { ReactElement } from 'react';

export default (): ReactElement => (
  <DocumentationPage>
    <Headline level='1'>
      Writing Documentation
    </Headline>

    <Paragraph>
      You would like to contribute to the wolkenkit documentation? Great, here
      you will find tips and components you can use to create great documentation
      that will empower developers.
    </Paragraph>

    <Headline level='2'>
      Paragraphs
    </Headline>

    <Paragraph>
      Use the <code>Paragraph</code> component for formatting texts. Be short
      and precise. Be kind and try to put yourself in the shoes of the
      application developer that does not.
    </Paragraph>

    <Headline level='2'>
      Code samples
    </Headline>

    <Headline level='3'>
      language: javascript
    </Headline>

    <Code language='javascript'>{`
      const greeting = 'Hello world';
    `}
    </Code>

    <Headline level='3'>
      language: typescript
    </Headline>

    <Code language='typescript'>{`
      const greeting: string = 'Hello world';
    `}
    </Code>

    <Headline level='3'>
      language: shell
    </Headline>

    <Code language='shell'>{`
      $ cd my-wolkenkit-sample-application
    `}
    </Code>

    <Headline level='2'>
      Hints
    </Headline>

    <Headline level='3'>
      type: congrats
    </Headline>

    <Hint type='congrats' title='Congratulations!'>
      <Paragraph>
        It&apos;s motivating to hear kind words when mastering a tricky task.
        Use type of hint, if you would like to reward the learner.
      </Paragraph>
    </Hint>

    <Headline level='3'>
      type: question
    </Headline>

    <Hint type='question' title='Do you think this makes sense?'>
      <Paragraph>
        Use this type…
      </Paragraph>
    </Hint>

    <Headline level='3'>
      type: free
    </Headline>

    <Hint type='tip' title='A tip for free'>
      <Paragraph>
        Use this type…
      </Paragraph>
    </Hint>

    <Headline level='3'>
      type: warning
    </Headline>

    <Hint type='warning' title='A word of warning'>
      <Paragraph>
        Use this type…
      </Paragraph>
    </Hint>

    <Headline level='3'>
      type: wisdom
    </Headline>

    <Hint type='wisdom' title='This is something to remember'>
      <Paragraph>
        Use this type…
      </Paragraph>
    </Hint>
  </DocumentationPage>
);
