# SaxAsync

SaxAsync é uma extensão da biblioteca [sax](https://github.com/isaacs/sax-js) que possibilita a 
utilização de eventos assincronos no processamento de arquivos XML

## Motivador

Quando se trabalha com grandes arquivos XML, provavelmente não é uma boa ideia usar um conversor 
de XML para objeto JavaScript ou simplesmente armazenar todo o documento na memória. E também pode
não ser interessante utilizar o sax por seus eventos só trabalharem com funções síncronas, impossibilitando
consulta de dados em banco de dados, leitura de um arquivo CNAB em paralelo, etc.

Para resolver essa limitação foi criado o SaxAsync, que possibilita a utilização de eventos assincronos combinando
os eventos do sax a uma função ["geradora"](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) 
e um emissor de eventos assincrono.

## Eventos

São suportados todos os eventos do sax. Além disso, se houver um erro durante o processamento do XML 
ele será emitido e o processo será interrompido.

## Instalação

```
npm install brunnofoggia/sax-async-js
```

## Exemplo de utilização

```
import { SaxAsync } from 'sax-async/lib/index';

async function example() {
    // "saxOptions" são as opções disponíveis no sax
    // "stream" é a stream de leitura do xml
    const strictMode = true;
    const parser = new SaxAsync(strictMode, { ...saxOptions, stream });

    // atribua os eventos que deseja utilizar
    parser.on('opentag', openTagCallback);
    parser.on('text', textCallback);
    parser.on('closetag', closeTagCallback);
    parser.on('end', endCallback);

    try {
        // inicie a leitura do XML e o disparo de eventos dentro de um try/catch para capturar erros
        await parser.execute();
    } catch (error) {
        // se houver um erro durante o processamento do XML
        // ele será emitido e o processo será interrompido
        console.error(error);
    }
}
```