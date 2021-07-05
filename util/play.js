const { MessageEmbed } = require('discord.js');
const moment = require('moment');
const { canModifyQueue, formatDate } = require('./Util');
const { createAudioPlayer, createAudioResource, entersState, getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice');
const { raw } = require('youtube-dl-exec');
// const { FFmpeg } = require('prism-media');

require('moment-duration-format');

// TODO: make play support other sites with ytdl

const filters = {
  bassboost: 'bass=g=20,dynaudnorm=f=200',
  '8d': 'apulsator=hz=0.08',
  vaporwave: 'aresample=48000,asetrate=48000*0.8',
  nightcore: 'aresample=48000,asetrate=48000*1.25',
  phaser: 'aphaser=in_gain=0.4',
  tremolo: 'tremolo',
  vibrato: 'vibrato=f=6.5',
  reverse: 'areverse',
  treble: 'treble=g=5',
  normalizer: 'dynaudnorm=f=200',
  surround: 'surround',
  pulsator: 'apulsator=hz=1',
  subboost: 'asubboost',
  karaoke: 'stereotools=mlev=0.03',
  flanger: 'flanger',
  gate: 'agate',
  haas: 'haas',
  mcompand: 'mcompand',
  earwax: 'earwax'
};

module.exports = {
  async play(song, message, updFilter = false) {
    const { client } = message;
    const queue = client.queue.get(message.guild.id);
    const seekTime = updFilter ? moment.duration(queue.resource.playbackDuration + queue.additionalStreamTime).format('hh:mm:ss') : '00:00:00';
    if (!song) {
      queue.player.stop();
      queue.connection.destroy();
      client.queue.delete(message.guild.id);
      return queue.textChannel.send('🚫 Music queue ended.');
    }
    const encoderArgsFilters = [];
    Object.keys(queue.filters).forEach(filterName => {
      if (queue.filters[filterName])
        encoderArgsFilters.push(filters[filterName]);
    });
    let encoderArgs;
    encoderArgsFilters.length < 1 ? encoderArgs = '' : encoderArgs = encoderArgsFilters.join(',');

    if (!queue.player) {
      queue.player = createAudioPlayer();
      queue.player.on('error', error => {
        client.logger.error(`A queue audio player encountered an error: ${error.stack || error}`);
        queue.textChannel.send({embeds: [
          new MessageEmbed()
            .setColor('#FF0000')
            .setTimestamp()
            .setTitle('Please report this on GitHub')
            .setURL('https://github.com/william5553/triv/issues')
            .setDescription(`**The audio player encountered an error.\nStack Trace:**\n\`\`\`${error.stack || error}\`\`\``)
            .addField('**Command:**', `${message.content}`)
        ]});
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      });
      queue.player.on(AudioPlayerStatus.Idle, () => {
        if (queue.collector && !queue.collector?.ended) queue.collector?.stop();
        queue.additionalStreamTime = 0;
        if (queue.loop) {
        // if loop is on, push the song back at the end of the queue
        // so it can repeat endlessly
          const lastSong = queue.songs.shift();
          queue.songs.push(lastSong);
          module.exports.play(queue.songs[0], message);
        } else {
        // Recursively play the next song
          queue.songs.shift();
          module.exports.play(queue.songs[0], message);
        }
      });
    }
    queue.resource = await _createAudioResource(song.url, seekTime, encoderArgs);
    queue.resource.volume.setVolume(queue.volume / 100);
    queue.player.play(queue.resource);
    queue.connection.subscribe(queue.player);
    try {
      await entersState(queue.player, AudioPlayerStatus.Playing, 5e3);
    } catch (error) {
      queue.textChannel.send(`An error occurred while trying to play **${song.title}**: ${error.message || error}`);
      client.logger.error(`Error occurred while trying to play music: ${error.stack || error}`);
      queue.connection?.destroy();
    }

    if (seekTime) 
      queue.additionalStreamTime = seekTime;
    
    let playingMessage;
    try {
      playingMessage = await queue.textChannel.send({embeds: [
        new MessageEmbed()
          .setTitle(song.title)
          .setURL(song.url)
          .setColor('#FF0000')
          .setThumbnail(song.thumbnail.url)
          .setDescription(`${seekTime.replace(':', '') >= 1 ? `Starting at ${seekTime}` : ''}`)
          .setAuthor(song.channel.name, song.channel.profile_pic, song.channel.url)
          .setFooter(`Length: ${song.duration <= 0 ? '◉ LIVE' : moment.duration(song.duration, 'seconds').format('hh:mm:ss', { trim: false })} | Published on ${formatDate(song.publishDate)}`)
      ]});
      await playingMessage.react('⏭');
      await playingMessage.react('⏯');
      await playingMessage.react('🔇');
      await playingMessage.react('🔉');
      await playingMessage.react('🔊');
      await playingMessage.react('🔁');
      await playingMessage.react('⏹');
      await playingMessage.react('🎤');
    } catch (error) {
      client.logger.error(error.stack || error);
    }

    const filter = (reaction, user) => user.id != client.user.id;
    queue.collector = playingMessage.createReactionCollector({ filter, time: song.duration > 0 ? song.duration * 1000 : 600000 });

    queue.collector.on('collect', (reaction, user) => {
      reaction.users.remove(user);
      if (!queue) return;
      const member = message.guild.members.cache.get(user.id);
      if (canModifyQueue(member) != true) return;
      switch (reaction.emoji.name) {
        case '⏭':
          queue.playing = true;
          queue.player.stop();
          queue.textChannel.send(`${user} ⏩ skipped the song`);
          queue.collector.stop();
          break;

        case '⏯':
          if (queue.playing) {
            queue.player.pause();
            queue.textChannel.send(`${user} ⏸ paused the music.`);
          } else {
            queue.player.unpause();
            queue.textChannel.send(`${user} ▶ resumed the music!`);
          }
          queue.playing = !queue.playing;
          break;

        case '🔇':
          if (queue.volume <= 0) {
            queue.volume = 100;
            queue.resource.volume.setVolume(1);
            queue.textChannel.send(`${user} 🔊 unmuted the music!`);
          } else {
            queue.volume = 0;
            queue.resource.volume.setVolume(0);
            queue.textChannel.send(`${user} 🔇 muted the music!`);
          }
          break;

        case '🔉':
          if (queue.volume === 0) return;
          if (queue.volume - 10 <= 0)
            queue.volume = 0;
          else
            queue.volume = queue.volume - 10;
          queue.resource.volume.setVolume(queue.volume / 100);
          queue.textChannel.send(`${user} 🔉 decreased the volume, the volume is now ${queue.volume}%`);
          break;

        case '🔊':
          if (queue.volume === 100) return;
          if (queue.volume + 10 >= 100)
            queue.volume = 100;
          else
            queue.volume = queue.volume + 10;
          queue.resource.volume.setVolume(queue.volume / 100);
          queue.textChannel.send(`${user} 🔊 increased the volume, the volume is now ${queue.volume}%`);
          break;

        case '🔁':
          queue.loop = !queue.loop;
          queue.textChannel.send(`${user} has ${queue.loop ? '**enabled**' : '**disabled**'} loop`);
          break;

        case '⏹':
          queue.textChannel.send(`${user} ⏹ stopped the music!`);
          queue.player.stop();
          if (queue.stream) queue.stream.destroy();
          if (getVoiceConnection(message.guild.id)) getVoiceConnection(message.guild.id).destroy();
          queue.collector.stop();
          client.queue.delete(message.guild.id);
          break;
          
        case '🎤':
          reaction.users.remove(client.user);
          client.commands.get('lyrics').run(client, message);
          break;

        default:
          break;
      }
    });

    queue.collector.on('end', () => {
      if (playingMessage) playingMessage.reactions.removeAll();
    });
  }
};

const _createAudioResource = (url/*, seek = '00:00:00', filters = ''*/) => {
  return new Promise((resolve, reject) => {
    const rawStream = raw(url, {
      o: '-',
      q: '',
      f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
      r: '100K'
    }, { stdio: ['ignore', 'pipe', 'ignore'] });
    if (!rawStream.stdout) {
      reject(new Error('No stdout'));
      return;
    }
    /*const FFMPEG_ARGUMENTS = [
      '-analyzeduration', '0',
      '-loglevel', '0',
      //'-f', 's16le',
      '-acodec', 'libopus',
      '-f', 'opus',
      '-ar', '48000',
      '-ac', '2'
    ];
  
    if (filters) FFMPEG_ARGUMENTS.push('-af', filters.join(','));
    const stream = new FFmpeg({
      args: ['-ss', seek, '-i', rawStream.stdout, ...FFMPEG_ARGUMENTS]
    });
  
    resolve(createAudioResource(stream, { inlineVolume: true }));*/
    resolve(createAudioResource(rawStream.stdout, { inlineVolume: true }));
  });
};